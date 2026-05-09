export interface IncomingMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  ts: number;
}

export type Action =
  | { type: "noop"; reason: string }
  | { type: "ephemeral_hint"; channelId: string; userId: string; text: string }
  | { type: "alert"; channelId: string; userId: string; reason: string };

export interface MessageSource {
  messages(): AsyncIterable<IncomingMessage>;
}

export interface ActionDispatcher {
  dispatch(action: Action): Promise<void>;
}
