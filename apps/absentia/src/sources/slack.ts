import { App } from "@slack/bolt";
import type { IncomingMessage, MessageSource } from "../ports.js";
import { AsyncQueue } from "../util/async-queue.js";

export interface SlackSourceDeps {
  botToken: string;
  appToken: string;
}

export class SlackMessageSource implements MessageSource {
  readonly app: App;
  private readonly queue = new AsyncQueue<IncomingMessage>();

  constructor(deps: SlackSourceDeps) {
    this.app = new App({
      token: deps.botToken,
      appToken: deps.appToken,
      socketMode: true,
    });

    this.app.message(async ({ message }) => {
      if (message.subtype !== undefined) return;
      if (!message.user || !message.text || message.text.trim() === "") return;
      this.queue.push({
        id: message.ts,
        channelId: message.channel,
        userId: message.user,
        text: message.text,
        ts: Math.round(parseFloat(message.ts) * 1000),
      });
    });
  }

  async start(): Promise<void> {
    await this.app.start();
  }

  async stop(): Promise<void> {
    await this.app.stop();
  }

  async *messages(): AsyncIterable<IncomingMessage> {
    while (true) {
      yield await this.queue.pop();
    }
  }
}
