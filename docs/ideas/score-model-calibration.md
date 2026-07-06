# 調査メモ: スコアモデル再調整（doseFactor 2.0 到達不能ほか）

> ステータス: 現時点では実装しない（Post-MVP候補）
> 作成日: 2026-07-06
> 最終照合日: 2026-07-06（`src/lib/rules/calculate-risk.ts` / `src/lib/validation.ts` / `src/lib/substances.ts` と突き合わせ）

本メモは**設計メモのみ**。コード・validation・スコア計算・テストは変更しない。Post-MVP のスコアモデル再調整候補として事実と論点を残す。

## 1. 要約

- 現行 validation は **`dose > veryHighMax` を棄却**する（`src/lib/validation.ts`）。
- そのため `getDoseMultiplier` の **`doseFactor = 2.0` 分岐は、検証済み入力経路（`evaluateRisk`）では実効上到達不能**（`src/lib/rules/calculate-risk.ts`）。
- **実効の doseFactor 上限は 1.6**。
- 結果として**単剤では mid/high に到達しにくく**、高スコアは複数物質併用・同一物質の複数エントリ入力で発生する。
- 修正は**今は実装しない**。Post-MVP の検討項目として §5 に整理。

## 2. 事実（*2026-07-06 時点*のコード。正は `src/lib/`）

### 2-1. doseFactor の段階（`calculate-risk.ts` `getDoseMultiplier`）

```
dose <= commonMax   → 1.0
dose <= highMax     → 1.3
dose <= veryHighMax → 1.6
それ以外（dose > veryHighMax） → 2.0   ← この分岐
```

### 2-2. validation の用量上限（`validation.ts`）

- 各エントリの `dose` は `doseBands.veryHighMax` を上限とし、**超過すると `dose` フィールドエラー**（評価は実行されない）。
- したがって `evaluateRisk`（アプリの入力経路）を通る限り `dose > veryHighMax` は成立せず、**`2.0` 分岐は選ばれない = 実効上デッドコード**。

> 補足（レイヤの違い）: 下位関数 `calculateRisk` を validation を経ずに直接呼べば `2.0` に到達し得る（ゴールデンは有効用量のみ使用）。ただしアプリの実経路は必ず `evaluateRisk`（validation 済み）であり、**プロダクト挙動としては到達不能**。

## 3. スコアへの影響（*2026-07-06 時点*）

- `finalScore = clamp(round(Σ solo + interactionAdd), 0, 100)`、`solo = base × routeFactor × doseFactor`。
- 実効 doseFactor 上限が 1.6 であることに加え、**単剤では相互作用ルールが1件も発火しない**（`interaction-rules.ts` の requires は複数物質/複数タグ前提）。
- そのため**単剤の最大 finalScore は 18**（methylphenidate・鼻腔・高用量帯）で **low 止まり**。
- mid/high は**複数物質の併用**、または**同一物質を複数エントリ**入力して `soloTotal` を積み増すことで到達する（例: 5物質併用で相互作用4件発火 → high 帯到達、重複入力で clamp 100）。
- ※ 各バンド（low/mid/high）自体は現行データで到達可能。本メモの論点は「**単剤での到達しにくさ**」と「**doseFactor 2.0 の死蔵**」という設計の歪み。

## 4. 今は修正しない理由

- MVP のスコアは「内部相対スケール（暫定値・要レビュー）」であり、`doseBands` も添付文書の上限ではない（`substances.ts` コメント）。スケール方針が未確定のまま 2.0 を活かす変更は時期尚早。
- validation 上限と doseFactor 段階は連動するため、片方だけの変更は不整合を生む（下記 §5 で一体検討する）。

## 5. Post-MVP で検討する論点

1. **validation 上限と doseFactor 段階の整合**
   - `veryHighMax` を上限にすると 2.0 段は永遠に使われない。上限と段階の関係を再設計するか、2.0 を廃するかを一体で決める。
2. **OD（過量）入力の仕様**
   - 過量ケースをどう入力・評価するか（そもそも受け付けるか、専用フラグにするか、警告付きで評価するか）。
3. **`veryHighMax` 超過時の扱い**
   - 現行の「棄却」から、**警告付きで評価継続**（doseFactor 2.0 相当を発火）に変えるかどうか。
4. **doseFactor 2.0 の処遇**
   - **削除**（段階を 1.0/1.3/1.6 の3段に確定）／**再定義**（境界や倍率の見直し）／**到達可能化**（§5-3 と連動）のいずれか。

## 6. 要確認チェックリスト

- [ ] スコアを内部相対スケールのまま運用するか、実尺度へ寄せるか（全体方針）
- [ ] `veryHighMax` の意味（評価スケール上限 vs 入力上限）の再定義
- [ ] 過量入力の受理ポリシー（UI/バリデーション/評価の一貫性）
- [ ] doseFactor 段階の最終形（3段 or 4段）と各倍率
- [ ] 変更時のゴールデン更新方針（`evaluate.golden.test.ts` の期待値）
