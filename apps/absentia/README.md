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
- Slack adapter is **not yet wired** — it will live alongside `log.ts` under
  `src/adapters/` and slot into the same `ActionDispatcher` port

## Run

```bash
# Offline, heuristic mock LLM (no API key needed):
echo "I'm stuck on this thing" | pnpm --filter @zetsu/absentia start:mock

# Live Claude scoring (needs ANTHROPIC_API_KEY):
echo "I'm stuck on this thing" | pnpm --filter @zetsu/absentia start
```

Each input line produces one JSON action on stdout. Empty lines are skipped.

## Test

```bash
pnpm --filter @zetsu/absentia test
```

Tests use `MockLLMClient + heuristicMock` so they run offline.
