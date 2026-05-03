#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MockLLMClient, heuristicMock } from "../src/llm/mock.js";
import { score } from "../src/score.js";
import type { ZetsuMode } from "../src/types.js";

interface EvalRow {
  text: string;
  expectedMode: ZetsuMode;
  expectedAxis: "intent" | "malice";
}

const here = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const isMock = args.has("--mock");

if (!isMock) {
  console.error("Only --mock dry-run is supported in Phase 0. Pass --mock.");
  process.exit(2);
}

function loadDataset(path: string): EvalRow[] {
  const raw = readFileSync(resolve(here, path), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as EvalRow);
}

const dataset = [
  ...loadDataset("dataset/intent.jsonl"),
  ...loadDataset("dataset/malice.jsonl"),
];

const llm = new MockLLMClient(heuristicMock);

interface Outcome {
  row: EvalRow;
  predicted: ZetsuMode;
  ok: boolean;
}

const outcomes: Outcome[] = [];
let correct = 0;

for (const row of dataset) {
  const result = await score({ text: row.text }, { llm });
  const ok = result.mode === row.expectedMode;
  if (ok) correct++;
  outcomes.push({ row, predicted: result.mode, ok });
}

const accuracy = correct / dataset.length;
console.log(`\nzetsu-core dry-run (heuristic mock LLM) — ${dataset.length} rows`);
console.log("─".repeat(72));
for (const { row, predicted, ok } of outcomes) {
  const symbol = ok ? "OK " : "XX ";
  const text = row.text.length > 60 ? row.text.slice(0, 57) + "..." : row.text;
  console.log(`  ${symbol} [${row.expectedAxis.padEnd(6)}] expected=${row.expectedMode.padEnd(7)} got=${predicted.padEnd(7)} | ${text}`);
}
console.log("─".repeat(72));
console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%  (${correct}/${dataset.length})`);
console.log("Note: dry-run uses a regex-based mock, not the live LLM. Phase-0 exit\n      criteria (>85% on labeled evals) applies to the real Anthropic call.\n");

if (accuracy < 1.0) {
  console.error("Dry-run accuracy below 100% on the bundled mock dataset — investigate before shipping.");
  process.exit(1);
}
