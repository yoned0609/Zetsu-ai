import { describe, expect, it, vi } from "vitest";
import { SlackActionDispatcher, type SlackChatClient } from "../src/adapters/slack.js";

function fakeClient() {
  const postEphemeral = vi.fn(
    async (_args: { channel: string; user: string; text: string }) => ({ ok: true }),
  );
  const postMessage = vi.fn(async (_args: { channel: string; text: string }) => ({ ok: true }));
  const client: SlackChatClient = { chat: { postEphemeral, postMessage } };
  return { client, postEphemeral, postMessage };
}

describe("SlackActionDispatcher", () => {
  it("sends ephemeral message for ephemeral_hint actions", async () => {
    const f = fakeClient();
    const d = new SlackActionDispatcher({ client: f.client, alertChannelId: "C-ALERT" });
    await d.dispatch({ type: "ephemeral_hint", channelId: "C1", userId: "U1", text: "hi" });
    expect(f.postEphemeral).toHaveBeenCalledWith({ channel: "C1", user: "U1", text: "hi" });
    expect(f.postMessage).not.toHaveBeenCalled();
  });

  it("posts to the alert channel for alert actions and includes user/channel refs", async () => {
    const f = fakeClient();
    const d = new SlackActionDispatcher({ client: f.client, alertChannelId: "C-ALERT" });
    await d.dispatch({ type: "alert", channelId: "C1", userId: "U2", reason: "sqlmap signature" });
    expect(f.postMessage).toHaveBeenCalledTimes(1);
    const args = f.postMessage.mock.calls[0]?.[0];
    expect(args?.channel).toBe("C-ALERT");
    expect(args?.text).toContain("U2");
    expect(args?.text).toContain("C1");
    expect(args?.text).toContain("sqlmap signature");
  });

  it("skips alert silently to stderr when alertChannelId is unset", async () => {
    const f = fakeClient();
    const d = new SlackActionDispatcher({ client: f.client });
    await d.dispatch({ type: "alert", channelId: "C1", userId: "U2", reason: "r" });
    expect(f.postMessage).not.toHaveBeenCalled();
    expect(f.postEphemeral).not.toHaveBeenCalled();
  });

  it("does nothing for noop actions", async () => {
    const f = fakeClient();
    const d = new SlackActionDispatcher({ client: f.client });
    await d.dispatch({ type: "noop", reason: "passive" });
    expect(f.postEphemeral).not.toHaveBeenCalled();
    expect(f.postMessage).not.toHaveBeenCalled();
  });
});
