import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient, LLMRequestOptions, LLMResponse } from "./client.js";

export interface AnthropicLLMClientOptions {
  apiKey?: string;
  client?: Anthropic;
}

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic;

  constructor(options: AnthropicLLMClientOptions = {}) {
    this.client =
      options.client ??
      new Anthropic({ apiKey: options.apiKey ?? process.env["ANTHROPIC_API_KEY"] });
  }

  async complete(opts: LLMRequestOptions): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 512,
      system: opts.systemPrompt,
      messages: [{ role: "user", content: opts.userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic response contained no text block");
    }
    return { text: textBlock.text, modelId: response.model };
  }
}
