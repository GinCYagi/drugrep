# drugrep

ハームリダクション目的の薬物リスクスコアリングWebアプリ。
物質・用量・投与経路を入力すると、リスクスコア(0-100)、警告、相互作用をリアルタイム表示します。

## 免責

本アプリは情報提供のみを目的とし、医療助言ではありません。緊急時は119へ。

## 技術構成

- Next.js (App Router) / React / TypeScript
- Zod(入力バリデーション)、Vitest(テスト)
- ルーティング: app/ のみ(src/app/ は不使用)
- ロジック: src/lib/(ルールエンジンは src/lib/rules/)

## アーキテクチャ原則

- `substances.ts` はデータ専用。ロジックを埋め込まない
- `calculateRisk` はデータ駆動(if-chain禁止)。物質・ルール追加は構造変更なしで可能
- 出典情報は `SourceRef` で管理する設計方針
- `assertRuleSources` による実行時検証は今後実装予定
- 現時点では一部ルールの出典整備が未完了
- スコア: `finalScore = clamp((base × route × dose) + interaction, 0, 100)`
- バリデーションは `src/lib/evaluate.ts` の境界で実施。ルールエンジンはZod非依存

## セットアップ

```bash
npm install
npm run dev        # http://localhost:3000
```

## テスト・ビルド

```bash
npm test           # Vitest
npx tsc --noEmit
npm run build
```

## デプロイ

Vercelにリポジトリを接続(設定はデフォルトで可)
