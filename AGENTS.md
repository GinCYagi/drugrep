<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ディレクトリ構成

- `app/` — UI（Next.js app router の実体）
- `src/lib/` — ロジック
- `src/lib/rules/` — スコアリング／リスク評価ルール
- `src/components/` — UI補助部品（`app/` から使う前提、正式に容認）
- `src/types/` — 型定義
- `src/lib/substances.ts` — 物質マスターデータ（データのみ、ロジック混入禁止）
- `src/app/` — 使わない（旧スキャフォールドは `_legacy_backup/src-app/` に退避済み）

## import alias

`tsconfig.json` の `@/*` はプロジェクトルート基準（`./*`）。`src/` 配下を参照するときは `@/src/lib/...` のように `src/` を省略せず書く。alias を `./src/*` 基準に寄せない（`app/` と `src/` を同じ alias で跨ぐために必要）。

