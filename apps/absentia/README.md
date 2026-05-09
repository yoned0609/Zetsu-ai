# Absentia (Phase 1)

Invisible Slack facilitator. Reads messages, scores them via `@zetsu/core`,
and dispatches a low-footprint action per Jidoka mode:

| Mode      | Action          | Rationale                                       |
| --------- | --------------- | ----------------------------------------------- |
| support   | ephemeral_hint  | DM-style nudge to the asker only                |
| mimicry   | alert           | Hostile/injection-style traffic — escalate      |
| passive   | noop            | Nothing to do                                   |

## MVP scope (current)

- `MessageSource` / `ActionDispatcher` ports defined in `src/ports.ts`
- CLI source (`src/sources/cli.ts`) reads stdin, one message per line
- Log dispatcher (`src/adapters/log.ts`) prints actions as JSON lines
- Slack source (`src/sources/slack.ts`) and dispatcher (`src/adapters/slack.ts`)
  use `@slack/bolt` Socket Mode + `@slack/web-api`. Activated automatically
  when `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` are both set.

## Run modes

| Invocation                                                | Source | Dispatcher | LLM |
| --------------------------------------------------------- | ------ | ---------- | --- |
| `pnpm --filter @zetsu/absentia start:mock`                | CLI    | log        | heuristic mock |
| `pnpm --filter @zetsu/absentia start` (no Slack tokens)   | CLI    | log        | Claude (needs `ANTHROPIC_API_KEY`) |
| `pnpm --filter @zetsu/absentia start` (Slack tokens set)  | Slack  | Slack      | Claude (needs `ANTHROPIC_API_KEY`) |

```bash
# Offline:
echo "I'm stuck on this thing" | pnpm --filter @zetsu/absentia start:mock

# Live Claude over CLI:
echo "I'm stuck on this thing" | pnpm --filter @zetsu/absentia start

# Full Slack mode:
pnpm --filter @zetsu/absentia start
```

Messages are processed sequentially — a slow LLM call (Sonnet p95 ≈ 40 s) holds
up the next message. For Phase 1 MVP this is acceptable; concurrency / queue
backpressure is a Phase 2 problem.

## Slack app setup

1. https://api.slack.com/apps → **Create New App** → From scratch. Pick a dev workspace.
2. **Socket Mode** → enable. Generate an App-Level Token with the
   `connections:write` scope. Save it as `SLACK_APP_TOKEN` (`xapp-...`).
3. **OAuth & Permissions** → add Bot Token Scopes:
   - `chat:write`
   - `chat:write.public` (optional, lets the bot post in unjoined public channels)
   - `channels:history`, `groups:history`, `im:history`, `mpim:history`
4. **Install to Workspace** → copy the Bot User OAuth Token (`xoxb-...`).
   Save as `SLACK_BOT_TOKEN`.
5. **Event Subscriptions** → enable. Subscribe to bot events:
   `message.channels`, `message.groups`, `message.im`, `message.mpim`.
6. Invite the bot into the channel(s) you want covered: `/invite @<your-bot>`.
7. Pick a channel for mimicry alerts (right-click the channel → Copy link →
   the `C...` segment is the ID). Set `SLACK_ALERT_CHANNEL_ID`. If unset,
   alerts are skipped with a stderr warning.
8. Run with all three Slack vars + `ANTHROPIC_API_KEY` set.

## Test

```bash
pnpm --filter @zetsu/absentia test
```

Tests use `MockLLMClient + heuristicMock` and a fake `SlackChatClient`, so
they run fully offline — no Slack workspace or API key required.
