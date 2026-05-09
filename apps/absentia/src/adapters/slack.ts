import type { Action, ActionDispatcher } from "../ports.js";

export interface SlackChatClient {
  chat: {
    postEphemeral(args: { channel: string; user: string; text: string }): Promise<unknown>;
    postMessage(args: { channel: string; text: string }): Promise<unknown>;
  };
}

export interface SlackDispatcherDeps {
  client: SlackChatClient;
  alertChannelId?: string;
}

export class SlackActionDispatcher implements ActionDispatcher {
  constructor(private readonly deps: SlackDispatcherDeps) {}

  async dispatch(action: Action): Promise<void> {
    switch (action.type) {
      case "ephemeral_hint":
        await this.deps.client.chat.postEphemeral({
          channel: action.channelId,
          user: action.userId,
          text: action.text,
        });
        return;
      case "alert":
        if (!this.deps.alertChannelId) {
          process.stderr.write(
            `slack-dispatcher: SLACK_ALERT_CHANNEL_ID unset, skipping alert: ${action.reason}\n`,
          );
          return;
        }
        await this.deps.client.chat.postMessage({
          channel: this.deps.alertChannelId,
          text: `:warning: zetsu mimicry detected in <#${action.channelId}> from <@${action.userId}>: ${action.reason}`,
        });
        return;
      case "noop":
        return;
    }
  }
}
