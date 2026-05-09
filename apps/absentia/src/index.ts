#!/usr/bin/env node
import {
  AnthropicLLMClient,
  MockLLMClient,
  heuristicMock,
  type LLMClient,
} from "@zetsu/core";
import { LogActionDispatcher } from "./adapters/log.js";
import { runPipeline } from "./pipeline.js";
import { CliMessageSource } from "./sources/cli.js";

async function main() {
  const useMock = process.argv.includes("--mock");
  let llm: LLMClient;
  if (useMock) {
    llm = new MockLLMClient(heuristicMock);
  } else {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      console.error("Set ANTHROPIC_API_KEY or pass --mock for offline runs.");
      process.exit(2);
    }
    llm = new AnthropicLLMClient();
  }

  await runPipeline({
    llm,
    source: new CliMessageSource(),
    dispatcher: new LogActionDispatcher(),
  });
}

await main();
