import type { Action, ActionDispatcher } from "../ports.js";

export class LogActionDispatcher implements ActionDispatcher {
  constructor(private readonly out: NodeJS.WritableStream = process.stdout) {}

  async dispatch(action: Action): Promise<void> {
    this.out.write(`${JSON.stringify({ ts: Date.now(), action })}\n`);
  }
}
