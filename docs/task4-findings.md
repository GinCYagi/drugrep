# Task4 所見: MVP 前に判断が必要な仕様齟齬

ゴールデンテスト（`src/lib/__tests__/evaluate.golden.test.ts`）作成時に、
現在の実装挙動と当初想定（課題前提の仕様記述）との間に 5 件の齟齬を検出した。

本ドキュメントは **報告のみ** であり、本番コード・テストは一切変更していない。
各項目について「現在の実装挙動 / 当初想定との差分 / MVP 修正必須か / 推奨対応 / 影響範囲」を整理する。

> 前提: 現状 `npm test` / `tsc` / `build` はすべて成功しており、
> 以下はいずれも「テストが落ちる不具合」ではなく「仕様判断が必要な設計上の齟齬」である。

## サマリー表

| # | 項目 | 当初想定との差分 | MVP 判定 |
|---|------|------------------|----------|
| 1 | clamp 未実装 | 式が `clamp(...,0,100)` 前提だが実装は `round(...)` のみ | Post-MVP でよい（ただし要記録） |
| 2 | RiskResult に score/level 無し | `score`/`level` 前提だが `finalScore` のみ | 要判断（UI 仕様依存） |
| 3 | sources が常に空 | 引用元保持が必須要件だがデータ・経路とも未整備 | 要判断（プロダクト要件依存） |
| 4 | evaluateRisk で相互作用が発火しない | 単剤評価のため相互作用は常に 0 件 | Post-MVP でよい（設計どおり・要明文化） |
| 5 | alias が evaluateRisk で拒否される | 別名入力が想定されるが validation が id 完全一致のみ | 要判断（入力 UI 仕様依存） |

---

## 1. clamp 未実装

### 現在の実装挙動
- `calculateRisk`（`src/lib/rules/calculate-risk.ts:140`）は
  `const finalScore = Math.round(solo + interactionAdd);` を返すのみ。
- `calculateCombinedRisk`（同 `:195`）も `Math.round(soloTotal + interactionAdd)` のみ。
- `Math.min(100, ...)` / `Math.max(0, ...)` に相当するクランプ処理はコード内に存在しない。

### 当初想定との差分
- 課題前提の式は `finalScore = clamp((base × route × dose) + interaction, 0, 100)`。
- 実測では `round(solo + interaction)` であり、上下限の丸め込みが無い。
- なお `evaluateRisk` 経由では validation が用量を上限（`veryHighMax`）で制限し、
  かつ単剤のみ評価するため、到達可能な最大スコアは **18**（nasal×最大用量）で、
  そもそも 100 に到達し得ない。→ 「クランプ前スコアが 100 超で finalScore===100」
  という入力は現状構成では作成不能。

### MVP 修正必須か
- **Post-MVP でよい。** 現行の到達スコア域（単剤で最大 18、複数薬合成でも
  現行ルールの加算幅は小さい）では上限 100 に達しないため、実害は顕在化しない。
- ただし「式が clamp 前提」という理解と実装が食い違っている点は記録が必要。

### 推奨対応
- 仕様として上限 100（および下限 0）を採用するなら、`finalScore` 算出箇所
  （`calculate-risk.ts:140` と `:195`）にクランプを 1 箇所ずつ追加。
- スコアの絶対値をどうスケールするか（100 満点にするのか、内部相対スケールのままか）
  をプロダクト側で先に決める。決めずにクランプだけ足すと「100 に張り付かない
  = 事実上クランプが効かない」状態のまま。

### 影響範囲
- `src/lib/rules/calculate-risk.ts`（finalScore 算出 2 箇所）。
- スコアを表示・レベル判定に使う UI 層（`app/` 配下）。
- 変更するとゴールデンテストの期待値更新が必要（意図的仕様変更として更新する前提）。

---

## 2. RiskResult に score/level が無く finalScore のみ

### 現在の実装挙動
- `RiskResult` 型（`src/types/domain.ts:157-169`）のフィールドは
  `finalScore` / `breakdown` / `firedInteractions` / `warnings` / `tags` / `sources`。
- `score` という名前のフィールドは存在せず、`level`（リスクレベル区分）も算出・保持していない。
- リスクの段階（stable/caution/high/critical 相当）は、この層では計算されない。

### 当初想定との差分
- 課題では RiskResult に `score` と `level` が含まれる前提だった。
- 実装は数値 `finalScore` のみを返し、レベルへの写像は行っていない。
- `AlertLevel`（`domain.ts:5`）や `InteractionSeverity` は型としては存在するが、
  `finalScore → level` の変換ロジックはリスク評価層に無い。

### MVP 修正必須か
- **要判断（UI 仕様依存）。**
  - UI が「数値スコアのみ」を表示するなら現状で MVP 成立 → 修正不要。
  - UI が色分け・段階ラベル（低/中/高 等）を出すなら、`level` 導出が必要になり MVP 必須。

### 推奨対応
- `finalScore` からレベルへ写像する純粋関数（例: `scoreToLevel(finalScore): AlertLevel`）を
  `src/lib/rules/` に追加し、`RiskResult` に `level` を足す。
- 併せて命名を確認: 呼称は `score` に寄せるか `finalScore` のままかをドキュメントで統一
  （現状は `finalScore`。UI 側の期待名と揃える）。
- しきい値（何点以上を high とするか）は clamp（#1）のスケール決定と連動するため、
  #1 とセットで判断する。

### 影響範囲
- `src/types/domain.ts`（RiskResult 型）、`src/lib/rules/calculate-risk.ts`（level 付与）。
- レベル表示を行う `app/` 配下 UI。
- ゴールデンテストの構造比較（キー集合を検証しているため期待値更新が必要）。

---

## 3. sources が常に空

### 現在の実装挙動
- `RiskResult.sources` は、発火した相互作用ルールの `rule.sources` からのみ積まれる
  （`src/lib/rules/calculate-risk.ts:101` `if (rule.sources) sources.push(...rule.sources)`）。
- しかし `src/lib/rules/interaction-rules.ts` の **どのルールにも `sources` が定義されていない**。
- 加えて `evaluateRisk` は単剤評価でルールが発火しない（#4 参照）。
- 結果として `sources` は現状 **常に `[]`**。発火しても（combined 経由でも）空のまま。
- なお `CombinedRiskResult`（`domain.ts:143-149`）にはそもそも `sources` フィールドが無い。

### 当初想定との差分
- 課題では「引用元（sources）の保持は必須要件」で、発火ルールの sources が
  空でないことを検証する想定だった。
- 実測ではデータ（ルール定義）・経路（単剤発火なし）の両面で sources が得られない。

### MVP 修正必須か
- **要判断（プロダクト要件依存）。**
  - 「MVP では引用元表示なし」で合意できるなら Post-MVP でよい。
  - 医療系情報として引用元提示が必須要件なら MVP 必須（データ整備が主作業）。

### 推奨対応
- コードではなく **データ整備が本丸**: `interaction-rules.ts` の各ルールに
  `sources: SourceRef[]`（文献・出典）を付与する。
- 併せて combined 経路でも sources を集約・提示するか
  （`CombinedRiskResult` に sources を追加するか）を UI 要件と合わせて決める。
- 出典の正確性はレビューが必要なため、プロダクト/医療監修側の判断を先に取る。

### 影響範囲
- `src/lib/rules/interaction-rules.ts`（データ追加）。
- 出典を表示する UI（`app/` 配下、about ページ等）。
- combined へ拡張する場合は `src/types/domain.ts` の `CombinedRiskResult` と
  `calculateCombinedRisk`。

---

## 4. evaluateRisk 経由では相互作用が発火しない

### 現在の実装挙動
- `evaluateRisk`（`src/lib/evaluate.ts:25`）は `parsed.data.entries[0]` の **単剤のみ** を
  `calculateRisk` に渡す。
- `calculateRisk` は相互作用判定を `evaluateInteractions([substance])`（単一要素集合）で行う
  （`calculate-risk.ts:135`）。
- 全 `interactionRules` は複数物質 or 複数タグ（`minCount >= 2`、または
  substance 指定 + 別タグ）を要求するため、単剤集合ではどのルールも一致しない。
- よって `evaluateRisk` 経由では `firedInteractions: []` / `breakdown.interactionAdd: 0` が常態。
- 相互作用の発火は `calculateCombinedRisk`（複数エントリ合成）でのみ起きる
  （例: tramadol_combo + moclobemide → `maoi_plus_serotonergic`, +10）。

### 当初想定との差分
- 課題では evaluateRisk のケースとして相互作用（tramadol + moclobemide）を想定していた。
- 実際は evaluateRisk は単剤オーケストレーション層であり、相互作用は責務外
  （設計コメント `evaluate.ts:18` にも「クロス相互作用の集計は calculateCombinedRisk の責務」と明記）。
- つまりこれは **バグではなく設計どおり** だが、当初想定との齟齬として明文化が必要。

### MVP 修正必須か
- **Post-MVP でよい（設計どおり）。** ただし「複数薬入力 → 相互作用評価」を
  MVP スコープに含めるなら、UI が `calculateCombinedRisk` を呼ぶ導線が必要。

### 推奨対応
- 責務分担（単剤=evaluateRisk / 複数薬=calculateCombinedRisk）をドキュメント化し、
  UI がどちらを呼ぶかを明確化する。
- MVP で複数薬併用評価が要るなら、UI 側で全エントリを `calculateCombinedRisk` に渡す
  導線を用意（`evaluate.ts` の単剤 API を拡張するのではなく、既存の combined API を使う）。

### 影響範囲
- 実装変更は不要（設計どおり）。要対応は UI の呼び分けとドキュメント。
- `app/` 配下（単剤カード vs 複数薬合成の呼び出し先）。

---

## 5. alias が evaluateRisk では拒否され、calculateRisk 層でのみ解決される

### 現在の実装挙動
- `evaluateRisk` はまず `RiskInputSchema` の validation を通す（`evaluate.ts:20`）。
- validation は `byId.get(entry.substanceId)`（`validation.ts:16,39`）で **正式 id の完全一致**
  のみ受理する。別名（商品名・日本語名・略号）は id マップに無いため
  「登録されていない物質です」エラーになる。
- 一方 `findSubstance`（`src/lib/find-substance.ts`）は id / aliases / genericName / displayName を
  照合し別名解決できるが、これは validation 通過後に `calculateRisk` 内部でのみ呼ばれる。
- 結果: 別名は `evaluateRisk` では拒否され、`calculateRisk` を直接呼んだ場合のみ解決される
  （例: `calculateRisk("リタリン", ...)` は methylphenidate と同一結果）。

### 当初想定との差分
- 課題では「日本語名や商品名などの別名入力が正式名称と同一結果になる」ことを
  evaluateRisk のケースとして想定していた。
- 実際は validation 層が別名を通さないため、evaluateRisk 経由では同一結果に到達しない。
- 別名解決能力（findSubstance）と入力検証（byId 完全一致）が **別レイヤに分断** されている。

### MVP 修正必須か
- **要判断（入力 UI 仕様依存）。**
  - UI が候補選択で常に正式 id を submit する設計なら、別名解決は不要 → 現状で MVP 成立。
  - UI がフリーテキストで別名入力を受け付けるなら、validation の別名解決対応が MVP 必須。

### 推奨対応
- 入力方式を先に確定する:
  - **候補選択（推奨）**: UI 側で displayName/alias を表示しつつ id を submit する。
    実装変更なしで整合。最も安全。
  - **フリーテキスト許容**: validation を `byId` 完全一致から `findSubstance` ベースの
    解決に寄せる（`validation.ts` の物質ルックアップを findSubstance に統一）。
    ただし別名の曖昧一致・重複時の挙動整理が必要で、影響が広がる。
- どちらにせよ「別名解決の責務をどのレイヤに置くか」を統一する。

### 影響範囲
- 候補選択で解決する場合: `app/` 配下の入力 UI のみ（ロジック変更なし）。
- validation を寄せる場合: `src/lib/validation.ts`（物質ルックアップ）、
  上限・経路検証の導出（現在 `byId` の Substance を使用）、関連ゴールデンテスト。

---

## 総括 / 推奨する意思決定順序

1. **スコアのスケール方針を先に決める**（#1 clamp と #2 level は連動）。
   100 点満点にするのか内部相対スケールのままか。ここが決まらないと clamp も
   level しきい値も定義できない。
2. **引用元(sources)を MVP 要件に含めるか決める**（#3）。含めるならデータ整備を計画に入れる。
3. **相互作用評価を MVP スコープに含めるか決める**（#4）。含めるなら UI の
   `calculateCombinedRisk` 呼び出し導線を設計（実装ロジックは既存で足りる）。
4. **入力方式（候補選択 or フリーテキスト）を確定する**（#5）。候補選択なら実装変更不要。

いずれも「実装を先に直す」より「プロダクト仕様を先に確定する」種類の齟齬であり、
先に方針を決めてから、ゴールデンテストの期待値を意図的な仕様変更として更新するのが安全。
