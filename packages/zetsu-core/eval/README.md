# zetsu-core evaluation harness

## Dry-run (no API key required)

```
pnpm --filter @zetsu/core eval:dry-run
```

Runs the bundled `dataset/intent.jsonl` and `dataset/malice.jsonl` rows against
the in-process `MockLLMClient + heuristicMock` regex scorer. It exists to verify
that the wiring (input → prompt → LLM → JSON parse → Jidoka mode-switch) holds
end-to-end without spending Anthropic credits.

## Live evaluation (Phase-0 exit criterion)

The PDF roadmap requires **>85% precision on a 200-row labeled dataset per axis
against the real Claude model**. That dataset and runner are not yet built — the
current files are intentionally a 14-row smoke set.

To-do before Phase 0 sign-off:
- expand `intent.jsonl` and `malice.jsonl` to ~200 rows each
- add a `--live` runner that uses `AnthropicLLMClient` with a real API key
- track precision/recall/F1 per axis, not just mode accuracy
