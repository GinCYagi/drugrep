## 共通文書規則

本プロジェクトの伝達文は、ProCで管理されるDocument Header Standardに従います。

参照コピー：
[`docs/standards/header-standard-current.md`](docs/standards/header-standard-current.md)

管理・更新方法：
[`docs/standards/README.md`](docs/standards/README.md)

# drugrep

ハームリダクション（害を減らす）を目的にした、薬物のリスクを数字で示す Web アプリです。
物質・用量・投与経路を入れると、リスクスコア（0〜100）・警告・飲み合わせ（相互作用）をその場で表示します。

公開中：https://drugrep.vercel.app

> **開発休止中**：専門性と医学的な裏づけの担保が課題のため。
> 出典のない判定は出さない作りにしていますが、物質や用量の区分を医学的に確かめられる人がいない状態で、扱う範囲を広げることはしません。

## 免責

本アプリは情報提供のみを目的とし、医療助言ではありません。緊急時は119へ。

## このアプリで大事にしたこと

**保証するのは判断材料で、利用者の判断ではない。ただし、その材料が誤った意味で読まれないことには責任を持つ。**（[設計原則](docs/design-principles.md)の Principle 0）

- **出典のないルールは一つも動かさない**：相互作用のルールはすべて出典（添付文書など）にひもづけ、テストで出典が空でないことを確かめています。出典の捏造は禁止です。
- **「計算が正しい」と「正しく読まれる」は別**：2026-07-06、承認の範囲内の用量（71mg）が、画面の「常用域」という言葉のせいで医学的な判断のように読めてしまうことを、実際の画面で見つけました（71mg Incident）。内部の計算は正しくても、言葉が意味を足してしまう。そこで、医学的な意味を持つ言葉を画面から外し、「評価モデル上の区分」であることを必ず書くようにしました。
- **読まれ方まで確かめる（Interpretation Validation）**：画面を変えたら、作った人とは別の人が実際の画面を読み、「どう誤解されうるか」まで確かめます。いまは Claude Code が実装し、作者（Gin）が画面を確かめる体制です。記録は[検証ログ](docs/interpretation-validation-log.md)にあります。
- **範囲外は数字を消し、手がかりは残す**：評価モデルの範囲を超える用量では数値スコアを出さず「適用範囲外」と表示します。それでも警告・相互作用・救急（119）の案内は出し続けます。

品質の確かめ方は 5 層です：Contract → Data → Logic → Presentation → Interpretation（→ 利用者の判断）。最後の「利用者の判断」は、アプリの責任がそこで終わることを示すためのものです。

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
