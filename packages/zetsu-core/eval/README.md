# zetsu-core evaluation harness

Two run modes share the same scoring pipeline (`score()`) and the same metrics
formatter; only the `LLMClient` and the dataset they read from differ.

## Datasets

```
dataset/
  smoke/      # 7 + 7 rows. Heuristic-tractable. Used by --mock as a wiring check.
  labeled/    # 100 + 100 rows. Mixed EN/JP, balanced positive/negative per axis. Used by --live.
```

Each row is `{"text": ..., "expectedMode": "support"|"mimicry"|"passive", "expectedAxis": "intent"|"malice"}`.

For per-axis precision/recall the harness picks the positive class by axis:
intent → `support`, malice → `mimicry`. Anything else (including `passive` and
the off-axis class) counts as the negative class within that axis.

## Dry-run (no API key)

```
pnpm --filter @zetsu/core eval:dry-run
```

Runs the smoke dataset through `MockLLMClient + heuristicMock`. Verifies that
input → prompt → JSON parse → Jidoka mode-switch wiring still holds. Asserts
**100%** mode accuracy on the smoke set; below that, exits non-zero.

## Live evaluation (Phase-0 exit criterion)

```
ANTHROPIC_API_KEY=sk-... pnpm --filter @zetsu/core eval:live
```

Runs the labeled dataset against the real Claude model with a concurrency cap of
5 in-flight requests. Reports per-axis confusion matrix, precision, recall, F1,
and latency p50/p95/max.

**Phase-0 sign-off:** per-axis precision must reach **≥ 85%**. The runner exits
non-zero if either axis falls below the floor. The 100-row-per-axis labeled set
is a first-pass; expanding to ~200 rows per axis (the PDF roadmap target)
remains a stretch goal.
