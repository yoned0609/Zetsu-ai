import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "../src/prompt.js";

describe("buildUserPrompt", () => {
  it("includes the input text wrapped in tags", () => {
    const prompt = buildUserPrompt({ text: "hello world" });
    expect(prompt).toContain("hello world");
    expect(prompt).toContain("<input_text>");
  });
  it("includes context block when provided", () => {
    const prompt = buildUserPrompt({ text: "x", context: "thread #design" });
    expect(prompt).toContain("thread #design");
    expect(prompt).toContain("<context>");
  });
  it("omits metadata block when empty", () => {
    const prompt = buildUserPrompt({ text: "x", metadata: {} });
    expect(prompt).not.toContain("<metadata>");
  });
  it("includes metadata when populated", () => {
    const prompt = buildUserPrompt({ text: "x", metadata: { ip: "1.2.3.4" } });
    expect(prompt).toContain("1.2.3.4");
    expect(prompt).toContain("<metadata>");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("instructs the model to return strict JSON with both axes", () => {
    expect(SYSTEM_PROMPT).toMatch(/STRICT JSON/);
    expect(SYSTEM_PROMPT).toMatch(/intent/);
    expect(SYSTEM_PROMPT).toMatch(/malice/);
  });
});
