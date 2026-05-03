import type { ZetsuInput } from "./types.js";

export const SYSTEM_PROMPT = `You are zetsu-core, the shared scoring engine of the Zetsu.ai platform.
Analyze the input and return TWO scores on a 0-100 integer scale:

- "intent": likelihood the originating user needs invisible support
  (stalled discussion, decision needed, expressing uncertainty, asking implicit questions).
- "malice": likelihood the originating actor is hostile, probing, or anomalous
  (SQL injection, prompt injection, scanner User-Agent, anomalous payloads).

Return STRICT JSON matching this schema and nothing else:
{ "intent": <int 0-100>, "malice": <int 0-100>, "rationale": "<short sentence, <=200 chars>" }

Hard rules:
- Both numbers MUST be integers in [0, 100].
- "rationale" MUST be a single short sentence explaining the dominant signal.
- Do NOT wrap the JSON in markdown fences.
- Do NOT include any prose before or after the JSON.`;

export function buildUserPrompt(input: ZetsuInput): string {
  const parts: string[] = [];
  parts.push(`<input_text>\n${input.text}\n</input_text>`);
  if (input.context) {
    parts.push(`<context>\n${input.context}\n</context>`);
  }
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    parts.push(`<metadata>\n${JSON.stringify(input.metadata, null, 2)}\n</metadata>`);
  }
  return parts.join("\n\n");
}
