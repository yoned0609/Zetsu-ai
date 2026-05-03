export interface LLMRequestOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  modelId: string;
}

export interface LLMClient {
  complete(opts: LLMRequestOptions): Promise<LLMResponse>;
}
