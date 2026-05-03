import type { LLMClient, LLMRequestOptions, LLMResponse } from "./client.js";

export type MockBehavior = (opts: LLMRequestOptions) => string;

export class MockLLMClient implements LLMClient {
  constructor(private readonly behavior: MockBehavior) {}

  async complete(opts: LLMRequestOptions): Promise<LLMResponse> {
    return { text: this.behavior(opts), modelId: `mock:${opts.model}` };
  }
}

const SQLI_OR_XSS = /(union\s+select|drop\s+table|or\s+1=1|<script|\.\.\/\.\.|etc\/passwd|;--|--\s|';)/i;
const PROMPT_INJECTION = /(ignore (previous|all) (instructions|prompts)|reveal the system|jailbreak|sudo\s+su)/i;
const RECON = /(sqlmap|nmap|nikto|gobuster|wpscan|burpsuite)/i;

const STUCK = /(stuck|stalled|not sure|uncertain|don['’]t know|決まらない|どうしよう|意見.*?(欲|ほし)|アドバイス|どうすべき)/i;
const QUESTION = /(\?|？|how (do|should|can)|what should|should we)/i;
const SETTLED = /(thanks|thank you|sounds good|ship it|let['’]s go|了解|問題ない|大丈夫)/i;

export const heuristicMock: MockBehavior = (opts) => {
  const text = opts.userPrompt;

  let intent = 30;
  if (STUCK.test(text)) intent = 85;
  else if (QUESTION.test(text)) intent = 65;
  if (SETTLED.test(text)) intent = Math.min(intent, 15);

  let malice = 5;
  if (SQLI_OR_XSS.test(text)) malice = 95;
  else if (PROMPT_INJECTION.test(text)) malice = 88;
  else if (RECON.test(text)) malice = 70;

  const dominant = malice >= intent ? `malice=${malice}` : `intent=${intent}`;
  return JSON.stringify({
    intent,
    malice,
    rationale: `heuristic mock: dominant=${dominant}`,
  });
};
