import { z } from "zod";

export const ZetsuModeSchema = z.enum(["support", "mimicry", "passive"]);
export type ZetsuMode = z.infer<typeof ZetsuModeSchema>;

export const ZetsuInputSchema = z.object({
  text: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  context: z.string().optional(),
});
export type ZetsuInput = z.infer<typeof ZetsuInputSchema>;

export const ZetsuScoreSchema = z.object({
  intent: z.number().min(0).max(100),
  malice: z.number().min(0).max(100),
  rationale: z.string().min(1).max(500),
});
export type ZetsuScore = z.infer<typeof ZetsuScoreSchema>;

export interface ZetsuResult {
  score: ZetsuScore;
  mode: ZetsuMode;
  raw: string;
  modelId: string;
  latencyMs: number;
}
