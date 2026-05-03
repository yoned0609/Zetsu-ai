import type { ZetsuThresholds } from "./config.js";
import type { ZetsuMode, ZetsuScore } from "./types.js";

export function decideMode(
  score: Pick<ZetsuScore, "intent" | "malice">,
  thresholds: Pick<ZetsuThresholds, "intentThreshold" | "maliceThreshold">,
): ZetsuMode {
  if (score.malice > thresholds.maliceThreshold) return "mimicry";
  if (score.intent > thresholds.intentThreshold) return "support";
  return "passive";
}
