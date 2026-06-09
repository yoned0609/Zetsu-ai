# Zetsu-ai monorepo — Roadmap / Tickets

> 各チケットは「入力 → 完了条件（DoD）→ 成果物 → リスク階層」を明示。既定値は **送らない・公開しない・マージしない・本番に出さない**。
> 進行中は `状態: doing`、完了したら `状態: done` に。失敗してライン停止したら `状態: stopped` + 5-Whys を `vault/30_Decisions/` に。

---

## TKT-001 — Phase 0 ゲートの再検証（post-hint prompt）

- **状態**: todo
- **リスク階層**: 低・可逆（評価実行のみ・コード変更なし）
- **背景**: `34b8425` で SYSTEM_PROMPT に optional-hint パラグラフが追加された。`v0.1.0-phase0` のゲート（precision ≥ 85%）は技術的には現行プロンプトで未検証。
- **入力**:
  - 既存の labeled dataset（`eval/dataset.jsonl`、200行）
  - 現行 SYSTEM_PROMPT（変更しない）
- **DoD（完了条件）**:
  - [ ] `pnpm eval:live`（claude-sonnet-4-6, n=200, concurrency=5）を1回完走
  - [ ] 各軸 precision / recall / F1 を `vault/30_Decisions/YYYY-MM-DD-phase0-reverify.md` に記録（過去の 100%/98% との差分も併記）
  - [ ] precision が各軸 85% 未満になった軸があれば、Chief of Staff へ `decide` で上げる
- **成果物**: 上記の決裁ログ Markdown 1枚
- **自律度**: 自動実行 + 事後 FYI（85% 未満なら `decide` に格上げ）

---

## TKT-002 — 注入系 malice ラベル例の追加（draft only）

- **状態**: todo
- **リスク階層**: 低・可逆（PR ドラフトのみ・main マージしない）
- **背景**: Phase 0 sign-off の carry-over #1。 ``host=`whoami` `` の backtick command injection が malice の唯一の FN だった。同型のパターンを labeled set に増やすほどゲートが現実の脅威を反映する。
- **入力**:
  - `eval/dataset.jsonl`（200行）
  - Phase 0 sign-off ノート（注入系を優先）
- **DoD**:
  - [ ] shell / SQL injection 系の malice 例を **5件** ドラフト追加（最低1件は backtick 形式、最低1件は SQL `'; DROP TABLE` 形式）
  - [ ] 各行の Intent / Malice / Mode ラベルをペアレビュー観点で迷わない粒度まで詰める
  - [ ] feature ブランチで PR ドラフトを開く（**main にマージしない**）
  - [ ] PR 本文に「TKT-001 完了後に TKT-001 と同じ条件で再評価予定」と明記
- **成果物**: PR ドラフト1本（dataset 差分 + コメント）
- **自律度**: 自動実行 + 事後 FYI（マージは人間）

---

## TKT-003 — apps/cameleon scaffold（空 package）

- **状態**: todo
- **リスク階層**: 低・可逆（PR ドラフトのみ・機能なし）
- **背景**: Phase 2（Cameleon = active-defense mimicry proxy）に向けて、まず空の workspace package を作っておくと依存解決の検証や CI 経路を Phase 2 着手前にならせる。**機能は実装しない。**
- **入力**:
  - 既存 `pnpm-workspace.yaml`（`apps/*` を含む）
  - 既存 `tsconfig.base.json`
- **DoD**:
  - [ ] `apps/cameleon/package.json`（`name: @zetsu/cameleon`、依存は `@zetsu/zetsu-core` のみ）
  - [ ] `apps/cameleon/tsconfig.json`（`extends: ../../tsconfig.base.json`）
  - [ ] `apps/cameleon/src/index.ts` は `export const placeholder = true;` のみ
  - [ ] ルートで `pnpm install` が通る
  - [ ] `pnpm -F @zetsu/cameleon build` が通る
  - [ ] feature ブランチで PR ドラフトを開く（**main にマージしない**）
- **成果物**: PR ドラフト1本（3ファイル追加 + lockfile 差分）
- **自律度**: 自動実行 + 事後 FYI（マージは人間）

---

## 次に並べたいチケット（参考・未着手）

- Phase 1 ホットパスを Haiku モデルに切り替える検証（Phase 0 sign-off carry-over #3、p95 ≈ 40s 対応）
- `apps/absentia` の cooldown / dedup（実トラフィックでスパムが出たら）
- AgentGate Phase 2 連携の I/F 検討（Cameleon との接続点を先に詰める）
