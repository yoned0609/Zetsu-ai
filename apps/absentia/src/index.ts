#!/usr/bin/env node
import {
  AnthropicLLMClient,
  MockLLMClient,
  heuristicMock,
  type LLMClient,
} from "@zetsu/core";
import { LogLevel } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { LogActionDispatcher } from "./adapters/log.js";
import { SlackActionDispatcher } from "./adapters/slack.js";
import { runPipeline } from "./pipeline.js";
import type { ActionDispatcher, MessageSource } from "./ports.js";
import { CliMessageSource } from "./sources/cli.js";
import { SlackMessageSource } from "./sources/slack.js";

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

  const slackBotToken = process.env["SLACK_BOT_TOKEN"];
  const slackAppToken = process.env["SLACK_APP_TOKEN"];
  const useSlack = !useMock && Boolean(slackBotToken && slackAppToken);

  let source: MessageSource;
  let dispatcher: ActionDispatcher;
  let slackSource: SlackMessageSource | null = null;

  if (useSlack && slackBotToken && slackAppToken) {
    const debugSlack = process.env["ABSENTIA_DEBUG_SLACK"] === "1";
    slackSource = new SlackMessageSource({
      botToken: slackBotToken,
      appToken: slackAppToken,
      ...(debugSlack ? { logLevel: LogLevel.DEBUG } : {}),
    });
    await slackSource.start();
    source = slackSource;
    const alertChannelId = process.env["SLACK_ALERT_CHANNEL_ID"];
    dispatcher = new SlackActionDispatcher({
      client: new WebClient(slackBotToken),
      ...(alertChannelId !== undefined ? { alertChannelId } : {}),
    });
    console.error(
      `absentia: Slack mode (alert channel: ${alertChannelId ?? "<unset, alerts will be skipped>"})`,
    );
  } else {
    source = new CliMessageSource();
    dispatcher = new LogActionDispatcher();
    console.error(
      `absentia: ${useMock ? "mock" : "live"} CLI mode — read from stdin, actions logged as JSON to stdout`,
    );
  }

  const shutdown = async (signal: string) => {
    console.error(`absentia: ${signal} received, shutting down`);
    if (slackSource) await slackSource.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await runPipeline({ llm, source, dispatcher });
}

await main();
