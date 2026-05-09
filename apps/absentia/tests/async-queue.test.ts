import { describe, expect, it } from "vitest";
import { AsyncQueue } from "../src/util/async-queue.js";

describe("AsyncQueue", () => {
  it("delivers items pushed before pop in FIFO order", async () => {
    const q = new AsyncQueue<number>();
    q.push(1);
    q.push(2);
    q.push(3);
    expect(await q.pop()).toBe(1);
    expect(await q.pop()).toBe(2);
    expect(await q.pop()).toBe(3);
  });

  it("resolves a pending pop when an item is later pushed", async () => {
    const q = new AsyncQueue<string>();
    const popped = q.pop();
    q.push("hello");
    expect(await popped).toBe("hello");
  });

  it("matches multiple pending pops to subsequent pushes in order", async () => {
    const q = new AsyncQueue<string>();
    const a = q.pop();
    const b = q.pop();
    q.push("first");
    q.push("second");
    expect(await a).toBe("first");
    expect(await b).toBe("second");
  });
});
