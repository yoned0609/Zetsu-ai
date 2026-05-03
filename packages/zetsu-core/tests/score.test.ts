import { describe, expect, it } from "vitest";
import type { LLMClient } from "../src/llm/client.js";
import { MockLLMClient } from "../src/llm/mock.js";
import { score } from "../src/score.js";

function fixed(text: string): LLMClient {
  return new MockLLMClient(() => text);
}

describe("score()", () => {
  it("routes high Intent to support mode", async () => {
    const llm = fixed(JSON.stringify({ intent: 85, malice: 5, rationale: "stalled" }));
    const r = await score({ text: "should we ship?" }, { llm });
    expect(r.mode).toBe("support");
    expect(r.score.intent).toBe(85);
  });

  it("routes high Malice to mimicry mode", async () => {
    const llm = fixed(JSON.stringify({ intent: 0, malice: 95, rationale: "SQLi" }));
    const r = await score({ text: "' OR 1=1 --" }, { llm });
    expect(r.mode).toBe("mimicry");
  });

  it("returns passive for neutral input", async () => {
    const llm = fixed(JSON.stringify({ intent: 30, malice: 10, rationale: "casual" }));
    const r = await score({ text: "lunch?" }, { llm });
    expect(r.mode).toBe("passive");
  });

  it("falls back to passive on malformed LLM output", async () => {
    const llm = fixed("this is not JSON at all");
    const r = await score({ text: "x" }, { llm });
    expect(r.mode).toBe("passive");
    expect(r.score.intent).toBe(0);
    expect(r.score.malice).toBe(0);
    expect(r.score.rationale).toMatch(/fallback/i);
  });

  it("strips markdown code fences before parsing", async () => {
    const llm = fixed('```json\n{"intent": 75, "malice": 5, "rationale": "needs help"}\n```');
    const r = await score({ text: "x" }, { llm });
    expect(r.mode).toBe("support");
    expect(r.score.intent).toBe(75);
  });

  it("falls back to passive when score values are out of range", async () => {
    const llm = fixed(JSON.stringify({ intent: 150, malice: 5, rationale: "x" }));
    const r = await score({ text: "x" }, { llm });
    expect(r.mode).toBe("passive");
  });

  it("respects custom thresholds", async () => {
    const llm = fixed(JSON.stringify({ intent: 60, malice: 5, rationale: "borderline" }));
    const r = await score({ text: "x" }, { llm, config: { intentThreshold: 50 } });
    expect(r.mode).toBe("support");
  });

  it("records modelId from the LLM response", async () => {
    const llm = fixed(JSON.stringify({ intent: 30, malice: 10, rationale: "x" }));
    const r = await score({ text: "x" }, { llm });
    expect(r.modelId).toMatch(/^mock:/);
  });
});
