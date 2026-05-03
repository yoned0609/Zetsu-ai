import { describe, expect, it } from "vitest";
import { decideMode } from "../src/jidoka.js";

const T = { intentThreshold: 70, maliceThreshold: 80 };

describe("decideMode", () => {
  it("returns mimicry when malice exceeds threshold", () => {
    expect(decideMode({ intent: 50, malice: 90 }, T)).toBe("mimicry");
  });
  it("returns support when intent exceeds threshold and malice is low", () => {
    expect(decideMode({ intent: 80, malice: 10 }, T)).toBe("support");
  });
  it("returns passive when both are below thresholds", () => {
    expect(decideMode({ intent: 50, malice: 10 }, T)).toBe("passive");
  });
  it("prefers mimicry over support when both fire", () => {
    expect(decideMode({ intent: 90, malice: 90 }, T)).toBe("mimicry");
  });
  it("uses strict greater-than (threshold value itself maps to passive)", () => {
    expect(decideMode({ intent: 70, malice: 80 }, T)).toBe("passive");
  });
});
