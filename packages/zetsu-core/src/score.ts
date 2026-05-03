import { DEFAULT_THRESHOLDS, type ZetsuConfig, type ZetsuThresholds } from "./config.js";
import { decideMode } from "./jidoka.js";
import type { LLMClient } from "./llm/client.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import {
  ZetsuInputSchema,
  ZetsuScoreSchema,
  type ZetsuInput,
  type ZetsuResult,
  type ZetsuScore,
} from "./types.js";

const PASSIVE_FALLBACK_RATIONALE = "fallback: malformed LLM output, defaulting to passive mode";

export interface ScoreOptions {
  llm: LLMClient;
  config?: Partial<ZetsuThresholds>;
}

function resolveConfig(llm: LLMClient, overrides: Partial<ZetsuThresholds> | undefined): ZetsuConfig {
  return { ...DEFAULT_THRESHOLDS, ...(overrides ?? {}), llm };
}

function tryParseScore(raw: string): ZetsuScore | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const result = ZetsuScoreSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export async function score(input: ZetsuInput, options: ScoreOptions): Promise<ZetsuResult> {
  const validatedInput = ZetsuInputSchema.parse(input);
  const config = resolveConfig(options.llm, options.config);

  const start = Date.now();
  const response = await config.llm.complete({
    model: config.primaryModel,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(validatedInput),
  });
  const latencyMs = Date.now() - start;

  const parsedScore = tryParseScore(response.text);
  if (!parsedScore) {
    return {
      score: { intent: 0, malice: 0, rationale: PASSIVE_FALLBACK_RATIONALE },
      mode: "passive",
      raw: response.text,
      modelId: response.modelId,
      latencyMs,
    };
  }

  return {
    score: parsedScore,
    mode: decideMode(parsedScore, config),
    raw: response.text,
    modelId: response.modelId,
    latencyMs,
  };
}
