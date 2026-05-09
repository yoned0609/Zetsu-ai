import { createInterface } from "node:readline";
import type { IncomingMessage, MessageSource } from "../ports.js";

export class CliMessageSource implements MessageSource {
  private counter = 0;

  async *messages(): AsyncIterable<IncomingMessage> {
    const rl = createInterface({ input: process.stdin });
    for await (const line of rl) {
      if (line.trim().length === 0) continue;
      this.counter++;
      yield {
        id: `cli-${this.counter}`,
        channelId: "cli",
        userId: "cli-user",
        text: line,
        ts: Date.now(),
      };
    }
  }
}
