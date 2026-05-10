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

The fastest path is to create the app from the bundled manifest — every
scope and event subscription is already declared. Files:

- `apps/absentia/slack-manifest.yaml` — paste into the YAML tab
- `apps/absentia/slack-manifest.json` — paste into the JSON tab (fallback
  if YAML parsing rejects the input)

Steps:

1. https://api.slack.com/apps → **Create New App** → **From an app manifest**.
   Pick a dev workspace, paste the manifest, click **Next** → **Create**.
2. **Basic Information** → **App-Level Tokens** → **Generate Token and
   Scopes**. Add the `connections:write` scope. Copy the resulting
   `xapp-...` value as `SLACK_APP_TOKEN`.
3. **OAuth & Permissions** → **Install to Workspace**. Copy the Bot User
   OAuth Token (`xoxb-...`) as `SLACK_BOT_TOKEN`.
4. In the Slack client, open the channel you want as the alert sink.
   Channel header → scroll to bottom of the modal → copy the `C...`
   Channel ID. Set it as `SLACK_ALERT_CHANNEL_ID`. If left unset, alerts
   are skipped with a stderr warning.
5. In every channel Absentia should listen to (including the alert
   channel, so it can post there): `/invite @zetsu_absentia`. The bot
   only receives `message.*` events from channels it has joined.
6. Run with all three Slack vars + `ANTHROPIC_API_KEY` set. If events
   aren't flowing, set `ABSENTIA_DEBUG_SLACK=1` to see the full Bolt
   debug stream.

## Operational debugging

Set `ABSENTIA_DEBUG_SLACK=1` alongside the Slack tokens to flip Bolt's
internal logger to `LogLevel.DEBUG`. You then see the full Socket Mode
event stream (auth handshake, WebSocket frames, every event payload, ack
calls, web-api HTTP traffic) on stderr — useful when wiring a new
workspace or chasing missing-event issues. Off by default.

## Test

```bash
pnpm --filter @zetsu/absentia test
```

Tests use `MockLLMClient + heuristicMock` and a fake `SlackChatClient`, so
they run fully offline — no Slack workspace or API key required.
