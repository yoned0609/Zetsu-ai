import type { LLMClient } from "./llm/client.js";

export interface ZetsuThresholds {
  intentThreshold: number;
  maliceThreshold: number;
  primaryModel: string;
  lowstakesModel: string;
}

export interface ZetsuConfig extends ZetsuThresholds {
  llm: LLMClient;
}

export const DEFAULT_THRESHOLDS: ZetsuThresholds = {
  intentThreshold: 70,
  maliceThreshold: 80,
  primaryModel: process.env["ZETSU_PRIMARY_MODEL"] ?? "claude-sonnet-4-6",
  lowstakesModel: process.env["ZETSU_LOWSTAKES_MODEL"] ?? "claude-haiku-4-5-20251001",
};
