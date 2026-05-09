#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AnthropicLLMClient } from "../src/llm/anthropic.js";
import type { LLMClient } from "../src/llm/client.js";
import { MockLLMClient, heuristicMock } from "../src/llm/mock.js";
import { score } from "../src/score.js";
import type { ZetsuMode } from "../src/types.js";

interface EvalRow {
  text: string;
  expectedMode: ZetsuMode;
  expectedAxis: "intent" | "malice";
}

interface Outcome {
  row: EvalRow;
  predicted: ZetsuMode;
  latencyMs: number;
  ok: boolean;
  error?: string;
}

interface AxisMetrics {
  axis: "intent" | "malice";
  positiveLabel: ZetsuMode;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

const PHASE_0_PRECISION_FLOOR = 0.85;
const LIVE_CONCURRENCY = 5;
const here = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const live = args.has("--live");
  const mock = args.has("--mock");
  if (live && mock) {
    console.error("Pass either --mock or --live, not both.");
    process.exit(2);
  }
  if (!live && !mock) {
    console.error("Specify a mode: --mock (heuristic dry-run) or --live (Anthropic API).");
    process.exit(2);
  }
  return { live };
}

function loadDataset(relPath: string): EvalRow[] {
  const raw = readFileSync(resolve(here, relPath), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as EvalRow);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  };
  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function runRow(llm: LLMClient, row: EvalRow): Promise<Outcome> {
  try {
    const result = await score({ text: row.text }, { llm });
    return {
      row,
      predicted: result.mode,
      latencyMs: result.latencyMs,
      ok: result.mode === row.expectedMode,
    };
  } catch (err) {
    return {
      row,
      predicted: "passive",
      latencyMs: 0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function computeAxisMetrics(outcomes: Outcome[], axis: "intent" | "malice"): AxisMetrics {
  const positiveLabel: ZetsuMode = axis === "intent" ? "support" : "mimicry";
  const rows = outcomes.filter((o) => o.row.expectedAxis === axis);
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const o of rows) {
    const expectedPos = o.row.expectedMode === positiveLabel;
    const predictedPos = o.predicted === positiveLabel;
    if (expectedPos && predictedPos) tp++;
    else if (!expectedPos && predictedPos) fp++;
    else if (!expectedPos && !predictedPos) tn++;
    else fn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    axis,
    positiveLabel,
    tp,
    fp,
    tn,
    fn,
    precision,
    recall,
    f1,
    support: rows.length,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx]!;
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function printAxis(m: AxisMetrics): void {
  console.log(`\n[${m.axis}]  positive=${m.positiveLabel}  n=${m.support}`);
  console.log(`  TP=${m.tp}  FP=${m.fp}  TN=${m.tn}  FN=${m.fn}`);
  console.log(
    `  precision=${fmtPct(m.precision)}  recall=${fmtPct(m.recall)}  f1=${fmtPct(m.f1)}`,
  );
}

async function main() {
  const { live } = parseArgs(process.argv.slice(2));
  const datasetDir = live ? "dataset/labeled" : "dataset/smoke";
  const dataset = [
    ...loadDataset(`${datasetDir}/intent.jsonl`),
    ...loadDataset(`${datasetDir}/malice.jsonl`),
  ];

  let llm: LLMClient;
  let modeLabel: string;
  if (live) {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      console.error("ANTHROPIC_API_KEY is required for --live.");
      process.exit(2);
    }
    llm = new AnthropicLLMClient();
    modeLabel = "live (Anthropic)";
  } else {
    llm = new MockLLMClient(heuristicMock);
    modeLabel = "mock (heuristic regex)";
  }

  console.log(`zetsu-core eval — ${modeLabel}`);
  console.log(`dataset=${datasetDir}  rows=${dataset.length}`);
  console.log("─".repeat(72));

  const concurrency = live ? LIVE_CONCURRENCY : dataset.length;
  const outcomes = await mapWithConcurrency(dataset, concurrency, (row) => runRow(llm, row));

  const failed = outcomes.filter((o) => !o.ok);
  for (const o of failed) {
    const text = o.row.text.length > 60 ? o.row.text.slice(0, 57) + "..." : o.row.text;
    const detail = o.error ? ` [error: ${o.error}]` : "";
    console.log(
      `  XX [${o.row.expectedAxis.padEnd(6)}] expected=${o.row.expectedMode.padEnd(7)} got=${o.predicted.padEnd(7)} | ${text}${detail}`,
    );
  }
  if (failed.length === 0) console.log("  (all rows matched expected mode)");

  const intentMetrics = computeAxisMetrics(outcomes, "intent");
  const maliceMetrics = computeAxisMetrics(outcomes, "malice");

  console.log("─".repeat(72));
  console.log(`Mode accuracy: ${fmtPct((dataset.length - failed.length) / dataset.length)}  (${dataset.length - failed.length}/${dataset.length})`);
  printAxis(intentMetrics);
  printAxis(maliceMetrics);

  const sortedLatencies = outcomes.map((o) => o.latencyMs).sort((a, b) => a - b);
  console.log(
    `\nLatency: p50=${percentile(sortedLatencies, 50)}ms  p95=${percentile(sortedLatencies, 95)}ms  max=${sortedLatencies.at(-1) ?? 0}ms\n`,
  );

  if (live) {
    const failedFloor: string[] = [];
    for (const m of [intentMetrics, maliceMetrics]) {
      if (m.precision < PHASE_0_PRECISION_FLOOR) {
        failedFloor.push(`${m.axis} precision ${fmtPct(m.precision)} < ${fmtPct(PHASE_0_PRECISION_FLOOR)}`);
      }
    }
    if (failedFloor.length > 0) {
      console.error(`Phase-0 exit criterion not met: ${failedFloor.join("; ")}`);
      process.exit(1);
    }
    console.log(`Phase-0 exit criterion met (per-axis precision ≥ ${fmtPct(PHASE_0_PRECISION_FLOOR)}).`);
  } else {
    if (failed.length > 0) {
      console.error("Mock dry-run accuracy below 100% on the bundled smoke dataset — investigate before shipping.");
      process.exit(1);
    }
    console.log("Mock dry-run wiring check passed (smoke dataset 100%).");
  }
}

await main();
