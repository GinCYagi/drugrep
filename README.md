## 共通文書規則

本プロジェクトの伝達文は、ProCで管理されるDocument Header Standardに従います。

参照コピー：
[`docs/standards/header-standard-current.md`](docs/standards/header-standard-current.md)

管理・更新方法：
[`docs/standards/README.md`](docs/standards/README.md)

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
- スコア（単剤）: `finalScore = clamp(round(solo + interactionAdd), 0, 100)`、`solo = base × routeFactor × doseFactor`（`clamp` は `src/lib/rules/calculate-risk.ts` の `clampScore` = `Math.max(0, Math.min(100, …))`）
- スコア（複数薬）: `soloTotal`（各エントリ `solo` の総和）+ `interactionAdd`。相互作用は dedupe 後のユニーク物質集合で判定（`calculateCombinedRisk`）
- `interactionAdd` は発火した相互作用ルールの寄与（`effect.value`）の合計
- 評価結果 `RiskResult` のフィールド: `finalScore` / `level` / `breakdown{base,routeFactor,doseFactor,interactionAdd}` / `firedInteractions` / `warnings` / `tags` / `sources`（`finalScore` はリネームしない）
- レベル閾値の正典は `src/lib/rules/score-level.ts`（`SCORE_LEVEL_THRESHOLDS` = `low:33 / mid:66`、`SCORE_MIN`/`SCORE_MAX` = 0/100）。`levelFor(finalScore)` で一元判定: `low`(0–33) / `mid`(34–66) / `high`(67–100)
- `/about` のバンド説明は `scoreBands()`（`score-level.ts`）から導出し、閾値をハードコードしない
- 出典は `SourceRef` カタログ（`src/lib/sources.ts`）を正典とし、ルールは `src("id")` で参照（`interaction-rules.ts`）。発火ルールの出典は `RiskResult.sources` に伝播し、`/about` で `aggregateSources`（id 重複除去）して表示
- `assertRuleSources` は各ルールの出典非空をテスト時に検証（実装済み）。MVP は代表 PI 6 件を採用済み
- バリデーションは `src/lib/evaluate.ts` の境界で実施。ルールエンジンはZod非依存
- 用量の入力受理とモデル適用範囲は別責務:
  - 入力ゲートは機械的異常値のみ（`INPUT_SANITY_MAX`、`validation.ts`）。モデル適用範囲外（`dose > veryHighMax`）は棄却せず受理する
  - 範囲外の判定はロジック層に一本化（`outOfModelRangeReason` → 構造化コード `ScoreSuppressionReason`）。UI は生の dose 比較を持たず、抑制理由を型で扱う
  - UI（`app/page.tsx`）は範囲外で数値スコアを出さず「適用範囲外」表示にし、タグ・相互作用・警告は継続表示する
  - スコア抑制は UI 層の責務で、`calculateCombinedRisk` は範囲外でも合算値を返す（複数薬で1エントリでも範囲外なら集計トップラインは一括で「適用範囲外」）
- ゴールデンは「リテラル固定」（実測値を転記。挙動変更時のみ理由付きで更新）。**Contract Check（C12）**: `substances.ts` の全物質が最低1本の golden に登場することを検査し（`substance-golden-coverage.contract.test.ts`）、物質追加時の golden 追加忘れをテストで停止する

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
