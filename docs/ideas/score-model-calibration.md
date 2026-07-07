# 調査メモ: スコアモデル再調整（doseFactor 2.0 再較正ほか）

> ステータス: 現時点では実装しない（Post-MVP候補）
> 作成日: 2026-07-06
> 最終照合日: 2026-07-07（`src/lib/rules/calculate-risk.ts` / `src/lib/validation.ts` / `src/lib/substances.ts` と突き合わせ）

本メモの残スコープ（doseFactor 2.0 の**再較正・削除**、および数値キャリブレーション Task5C-2）は**設計メモのみ**で、コード・validation・スコア計算・テストは変更しない。Post-MVP の再調整候補として事実と論点を残す。

## 0. 実装反映（2026-07-07・Gin 承認）

71mg Incident の裁定（`veryHighMax` は臨床上限ではなく内部帯）の必然的帰結として、§5 の一部を **MVP に取り込み実装した**。本メモは残りの Post-MVP スコープへ再限定する。

- **§5-2（OD 入力の仕様）実装済み**: 現実的な過量入力を受理する（入力受理とモデル適用範囲を分離）。
- **§5-3（`veryHighMax` 超過時の扱い）実装済み**: 「棄却」から「受理 → UI で数値スコア非表示＋『適用範囲外』表示、判断材料は継続表示」へ変更。入力ゲートは `INPUT_SANITY_MAX`（機械的異常値のみ）に置換（`validation.ts`）。範囲外の判定はロジック層 `outOfModelRangeReason`（構造化コード `ScoreSuppressionReason` = `"dose_out_of_model_range"`）に一本化し、UI は生の dose 比較を持たない（表示層依存の排除）。
- **§5-4 のうち「到達可能化」部分のみ実装済み**: 入力ゲート撤去により `doseFactor 2.0` 分岐が到達可能になった（golden `evaluateRisk — golden (out-of-range …)` / `calculateCombinedRisk — golden (out-of-range, no suppression)` で固定）。ただし **2.0 の再較正・削除・境界見直しは未着手（残スコープ）**。
- **未着手（残スコープ）**: §5-1（validation 上限と段階の整合＝スケール全体方針）、§5-4 の再較正/削除、および §7 の **Task5C-2（数値キャリブレーション）**。

> 提案（未実施）: 本メモは §5-2/§5-3 が実装済みとなり「純粋にまだやらないもの」ではなくなった。`docs/ideas/` のライフサイクル（実装が決まったものは昇格）に沿うなら、残スコープ（2.0 再較正＋Task5C-2）を `docs/` 直下の Post-MVP 課題へ昇格し、本ファイルはアーカイブ化する案がある。ファイル移動＝構造変更のため Gin 承認後に実施する。

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

> §0（2026-07-07）で 2・3 は実装済み、4 は「到達可能化」のみ実装済み。残スコープは 1 と 4 の再較正/削除。

1. **validation 上限と doseFactor 段階の整合**（**残スコープ**）
   - `veryHighMax` を上限にすると 2.0 段は永遠に使われない。上限と段階の関係を再設計するか、2.0 を廃するかを一体で決める。
   - ※ 入力ゲートからの `veryHighMax` 撤去は実施済み（§0）。ここで扱うのは「段階（1.0/1.3/1.6/2.0）そのものの再設計」。
2. ~~**OD（過量）入力の仕様**~~ → **【実装済み 2026-07-07】** 現実的な過量入力を受理（§0）。
3. ~~**`veryHighMax` 超過時の扱い**~~ → **【実装済み 2026-07-07】** 受理 → UI「適用範囲外」表示、評価継続（§0）。
4. **doseFactor 2.0 の処遇**（**残スコープ**：到達可能化のみ実装済み）
   - **削除**（段階を 1.0/1.3/1.6 の3段に確定）／**再定義**（境界や倍率の見直し）のいずれか。**到達可能化は §0 で実施済み**。

## 6. 要確認チェックリスト

- [ ] スコアを内部相対スケールのまま運用するか、実尺度へ寄せるか（全体方針）
- [ ] `veryHighMax` の意味（評価スケール上限 vs 入力上限）の再定義
- [ ] 過量入力の受理ポリシー（UI/バリデーション/評価の一貫性）
- [ ] doseFactor 段階の最終形（3段 or 4段）と各倍率
- [ ] 変更時のゴールデン更新方針（`evaluate.golden.test.ts` の期待値）

## 7. 裁定と UI 文言の是正記録（2026-07-06）

**裁定（Gin 承認）**: `doseBands`（`commonMax`/`highMax`/`veryHighMax`）は**内部相対スケール**であり、**臨床上限・添付文書の承認用量ではない**、という設計意図を正として承認する。

**未実施の事実**: 全物質の `doseBands` と `base`（タグ weight）を、収集済み PI/IF と突合する**キャリブレーションは未実施**。`substances.ts` の doseBand 数値は初出 **`f5bf255`（2026-04-15、rebase/restructure コミット）** 以来**未変更**（移動 `27f714e` / route 追加 `c126631` のみ）。数値を根拠づけた設計文書は存在しない。

**発見された UI 実害（Release 差し戻し理由）**: 内部閾値を臨床用語で提示していた。
- `calculate-risk.ts` 警告「設定用量が**常用域**を超えています」（`commonMax` 超で発火）。MPH は `commonMax=60` が承認最大 72mg / 小児 54mg を跨ぐため、**承認内の 71mg でも「常用域超え」表示**となり、適法・適正な処方量を危険側に誤認させ得た。
- `validation.ts`「用量が**上限**(veryHighMax)を超えています」も同種（内部帯を「上限」と提示）。

**是正（本コミット群）**: 上記2文言を「評価モデル上の区分」であることが分かる表現へ変更し、`/about` 限界と制限事項に「用量区分・上限は評価モデル用で承認用量とは異なる」旨の一文を追加。golden の警告期待値も更新（数値・doseFactor は不変、文言のみ）。

**Post-MVP 最優先（格上げ）**: **Task5C-2 =「`substances.ts` の全数値（`doseBands`・`base` タグ weight）を台帳の一次資料（PI/IF）と突合するキャリブレーション」**。次の一貫性目標は「出典と照合されていない数値でスコアが動く箇所をゼロにする」。加えて `/about:64`「各係数の根拠は下記の出典一覧を参照」は現状 doseBands の出典を含まないため、Task5C-2 で係数出典化と併せて是正する。

**用量範囲（`doseBands`）への SourceRef 付与（Fable レビュー 2026-07-07 指摘）**: 現状 `doseBands`（`commonMax`/`highMax`/`veryHighMax`）には出典が紐づいていない。適用範囲外（`dose > veryHighMax`）の境界がスコア表示を左右するようになった今、この境界値も「出典と照合されていない数値」に該当する。**用量範囲そのものへの `SourceRef` 付与を Task5C-2 のスコープに明示的に含める**（相互作用ルールの sources と同様に、境界値の根拠を台帳から辿れるようにする）。MVP では扱わず Post-MVP 課題として残す。
