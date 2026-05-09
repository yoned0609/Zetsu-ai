# Live evaluation results

Frozen records of `pnpm eval:live` runs that were used to gate phase exits.
Add a new section per run; do not edit prior sections.

## 2026-05-10 — Phase 0 sign-off

- Model: `claude-sonnet-4-6` (default `ZETSU_PRIMARY_MODEL`)
- Dataset: `dataset/labeled` (100 intent + 100 malice rows)
- Concurrency: 5
- Runner: `eval/run.ts` at commit `d4dcaf8`

### Per-axis metrics

| Axis    | n   | TP | FP | TN | FN | Precision | Recall | F1     |
| ------- | --- | -- | -- | -- | -- | --------- | ------ | ------ |
| intent  | 100 | 50 |  0 | 50 |  0 | 100.0%    | 100.0% | 100.0% |
| malice  | 100 | 49 |  0 | 50 |  1 | 100.0%    |  98.0% |  99.0% |

Phase 0 exit criterion (per-axis precision ≥ 85%): **met**.

### Aggregate

- Mode accuracy (3-way): 94.5% (189/200)
- Latency: p50=1765 ms, p95=39935 ms, max=42638 ms
- Wall time: 1m26s

### Notes carried into Phase 1

- The single malice FN was `host=\`whoami\`` — backtick command injection
  classified as `passive`. When growing the labeled set toward the
  ~200 rows/axis stretch goal, prioritize injection-style malice rows
  over additional benign-query examples.
- 10 of the 11 mode-accuracy misses were malice-axis "passive" rows
  predicted as "support". Harmless under the per-axis binary framing
  (still TN for malice), but worth tracking as a 3-way Jidoka mode-switch
  quality signal.
- p95 latency ≈ 40 s under concurrency 5 means real-time hot paths in
  Phase 1/2 cannot block on the primary scoring call. Use
  `ZETSU_LOWSTAKES_MODEL` (Haiku) inline; reserve Sonnet for batch passes.
