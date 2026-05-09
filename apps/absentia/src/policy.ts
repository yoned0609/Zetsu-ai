import type { ZetsuResult } from "@zetsu/core";
import type { Action, IncomingMessage } from "./ports.js";

export function decideAction(msg: IncomingMessage, result: ZetsuResult): Action {
  switch (result.mode) {
    case "support":
      return {
        type: "ephemeral_hint",
        channelId: msg.channelId,
        userId: msg.userId,
        text: buildHint(result),
      };
    case "mimicry":
      return {
        type: "alert",
        channelId: msg.channelId,
        userId: msg.userId,
        reason: result.score.rationale,
      };
    case "passive":
      return { type: "noop", reason: result.score.rationale };
  }
}

function buildHint(result: ZetsuResult): string {
  if (result.score.hint && result.score.hint.length > 0) return result.score.hint;
  return `Looks like you might want a hand. Quick read: ${result.score.rationale}`;
}
