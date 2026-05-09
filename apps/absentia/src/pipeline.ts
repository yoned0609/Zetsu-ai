import { score, type LLMClient, type ZetsuResult } from "@zetsu/core";
import { decideAction } from "./policy.js";
import type { Action, ActionDispatcher, IncomingMessage, MessageSource } from "./ports.js";

export interface HandledMessage {
  result: ZetsuResult;
  action: Action;
}

export async function handleMessage(msg: IncomingMessage, llm: LLMClient): Promise<HandledMessage> {
  const result = await score({ text: msg.text }, { llm });
  return { result, action: decideAction(msg, result) };
}

export interface PipelineDeps {
  llm: LLMClient;
  source: MessageSource;
  dispatcher: ActionDispatcher;
}

export async function runPipeline(deps: PipelineDeps): Promise<void> {
  for await (const msg of deps.source.messages()) {
    const { action } = await handleMessage(msg, deps.llm);
    await deps.dispatcher.dispatch(action);
  }
}
