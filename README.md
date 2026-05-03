# Zetsu.ai

Invisible intelligence platform. Two flagship products powered by a shared scoring engine:

- **Absentia** — invisible Slack facilitator (Phase 1)
- **Cameleon** — active-defense mimicry proxy (Phase 2)
- **Jidoka loop** — cross-product learning pipeline (Phase 3)

This monorepo currently contains **Phase 0**: `packages/zetsu-core`, the shared LLM-driven scoring engine that classifies inputs along two axes — **Intent** (need for support) and **Malice** (hostile behavior) — and applies the Jidoka mode-switch.

## Quick start

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm eval:dry-run
```

`eval:dry-run` runs the evaluation harness against the bundled MockLLMClient, so no API key is required.

## Layout

```
packages/
  zetsu-core/     # shared scoring engine (Phase 0)
apps/             # absentia / cameleon (Phase 1+, not yet)
```

## Sibling projects (future integration points)

- `../AgentGate` — JIT authorization proxy (Python). Cameleon will integrate over its API/webhooks.
- `../Jidoka.ai` — runtime safety / Andon dashboard (TypeScript). The Phase-3 learning loop is a separate offline pipeline that may emit signals back to Jidoka.ai.
