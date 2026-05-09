import { MockLLMClient, heuristicMock } from "@zetsu/core";
import { describe, expect, it } from "vitest";
import { handleMessage } from "../src/pipeline.js";
import type { Action, IncomingMessage } from "../src/ports.js";
import { LogActionDispatcher } from "../src/adapters/log.js";
import { runPipeline } from "../src/pipeline.js";
import type { MessageSource } from "../src/ports.js";

const llm = new MockLLMClient(heuristicMock);

const msg = (id: string, text: string): IncomingMessage => ({
  id,
  channelId: "C1",
  userId: "U1",
  text,
  ts: 0,
});

describe("handleMessage → policy", () => {
  it("emits ephemeral_hint when intent dominates (support mode)", async () => {
    const { result, action } = await handleMessage(
      msg("a", "I'm stuck on this and don't know what to do"),
      llm,
    );
    expect(result.mode).toBe("support");
    expect(action).toMatchObject({
      type: "ephemeral_hint",
      channelId: "C1",
      userId: "U1",
    });
    if (action.type === "ephemeral_hint") {
      expect(action.text.length).toBeGreaterThan(0);
    }
  });

  it("emits alert when malice dominates (mimicry mode)", async () => {
    const { result, action } = await handleMessage(
      msg("b", "'; DROP TABLE users; --"),
      llm,
    );
    expect(result.mode).toBe("mimicry");
    expect(action).toMatchObject({ type: "alert", channelId: "C1", userId: "U1" });
  });

  it("emits noop when neither axis crosses (passive mode)", async () => {
    const { result, action } = await handleMessage(
      msg("c", "thanks, sounds good"),
      llm,
    );
    expect(result.mode).toBe("passive");
    expect(action.type).toBe("noop");
  });

  it("uses the LLM-supplied hint verbatim when the score includes one", async () => {
    const llmWithHint = new MockLLMClient(() =>
      JSON.stringify({
        intent: 90,
        malice: 5,
        rationale: "asker stalled on a design call",
        hint: "Try sketching the failing case in a thread.",
      }),
    );
    const { action } = await handleMessage(msg("h", "I'm stuck"), llmWithHint);
    expect(action).toMatchObject({
      type: "ephemeral_hint",
      text: "Try sketching the failing case in a thread.",
    });
  });

  it("falls back to a rationale-templated hint when the score has no hint", async () => {
    const llmNoHint = new MockLLMClient(() =>
      JSON.stringify({ intent: 90, malice: 5, rationale: "asker is stuck" }),
    );
    const { action } = await handleMessage(msg("h2", "I'm stuck"), llmNoHint);
    if (action.type !== "ephemeral_hint") throw new Error("expected ephemeral_hint");
    expect(action.text).toContain("asker is stuck");
  });
});

class ArrayMessageSource implements MessageSource {
  constructor(private readonly items: IncomingMessage[]) {}
  async *messages(): AsyncIterable<IncomingMessage> {
    for (const m of this.items) yield m;
  }
}

class CapturingDispatcher extends LogActionDispatcher {
  readonly captured: Action[] = [];
  override async dispatch(action: Action): Promise<void> {
    this.captured.push(action);
  }
}

describe("runPipeline", () => {
  it("dispatches one action per incoming message in order", async () => {
    const dispatcher = new CapturingDispatcher();
    await runPipeline({
      llm,
      source: new ArrayMessageSource([
        msg("1", "I'm stuck and don't know what to do"),
        msg("2", "thanks, sounds good"),
        msg("3", "'; DROP TABLE users; --"),
      ]),
      dispatcher,
    });
    expect(dispatcher.captured.map((a) => a.type)).toEqual([
      "ephemeral_hint",
      "noop",
      "alert",
    ]);
  });
});
