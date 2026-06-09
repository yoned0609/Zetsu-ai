# Daily Brief Format（Chief of Staff 出力規約）

> CEOが1日に触れる**唯一の文書**。`vault/00_Inbox/daily-brief/YYYY-MM-DD.md` として日次1本。
> ここに従うように Chief of Staff（Phase 1 で起動）を構成する。フォーマット変更は決裁ログ経由のみ。

---

## ファイル命名

`vault/00_Inbox/daily-brief/<YYYY-MM-DD>.md` — UTC ではなく **JST** 基準で日付を切る。

## Markdown セクション（この順序で固定）

```markdown
# Daily Brief — YYYY-MM-DD

## ③ 要判断（decide）— ≤3件
1. **<1行サマリ>** — 推奨: <A/B>。根拠: <vault/... or PR URL>
2. ...
3. ...
（4件目以降は統合 or 翌日延期。CoS が3件に圧縮する）

## ② 要承認（approve）— yes/no で済む件
- **<件名>** — <一言>。根拠: <ref>
- ...

## ① FYI — 報告のみ
- <件名> — <ref>
- ...

## ⚠ アラート（停滞・遅延・Jidoka ライン停止）
- 🔴 <件名> — <原因/状態>。再開条件: <条件>
- ...
```

- **③ が空の日**は「本日 decide なし」と明示（沈黙＝何もない、にしない）
- **⚠ が空の日**はセクションごと省略してよい
- ② と ① は件数が多ければ折りたたみセクションを使ってよい

## 各件に必ず付与する属性（Jidoka 検査の最小条件）

| 属性 | 説明 |
|---|---|
| `tier` | low / mid / high |
| `report_to` | fyi / approve / decide |
| `ref` | 元成果物への絶対パス or URL（vault path 推奨） |
| `summary` | 120字以内の1行サマリ |
| `recommendation` | decide / approve のときのみ必須 |

## JSON Schema（chief-of-staff の出力検査用・正本は `chief-of-staff.CLAUDE.md` § 10）

```json
{
  "type": "object",
  "required": ["date", "decide", "approve", "fyi", "alerts"],
  "properties": {
    "date":    { "type": "string", "format": "date" },
    "decide":  {
      "type": "array", "maxItems": 3,
      "items": {
        "type": "object",
        "required": ["summary","recommendation","ref"],
        "properties": {
          "summary":        { "type": "string", "maxLength": 120 },
          "recommendation": { "type": "string" },
          "ref":            { "type": "string" }
        }
      }
    },
    "approve": { "type": "array", "items": { "type": "object" } },
    "fyi":     { "type": "array", "items": { "type": "string" } },
    "alerts":  { "type": "array", "items": { "type": "string" } }
  }
}
```

## 圧縮ルール（CoS の自律的な判断）

- decide が4件以上 → 同テーマで統合できないか試す → ダメなら翌日に1件回す
- approve が10件以上 → 同種をバッチ化（「PRドラフト5件まとめて承認」など）
- 同じ alert が3日連続出たら CoS は decide に格上げ（"このアラートをどう扱うか" を CEO に上げる）

## 既定値

- 既定は **送信しない・公開しない・実行しない**。CoS は「ブリーフを置く」までで止まる。
- decide の推奨は「CoS から見た仮置き」であって、CEO を縛らない。
