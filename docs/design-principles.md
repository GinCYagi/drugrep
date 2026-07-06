# drugrep 設計原則（Design Principles）

## Principle 0（最上位原則）

> drugrep が保証するのは利用者の判断ではなく、判断材料である。ただし、その判断材料が誤った意味として解釈されないことについては、設計上の責任を負う。

---

## 既存原則の条文化

- 出典なしで発火するルールはゼロ。
- 出典の捏造禁止。
- Candidate は承認まで実装ファイルに入らない。
- golden 期待値の更新は1件ごと理由付き。

---

## Rule IV-1（Interpretation Principle）

- UI は内部モデルを医学的事実として表現してはならない。
- 評価モデル由来の区分・スケールは、その旨を必ず明示する。
- 判定基準: その語が持つ意味を**モデル自身が保証しているか**。保証していない意味を持つ語は**外部意味語彙**として扱う。

---

## Rule IV-2（Interpretation Validation）

- UI 変更時、実装者とは別のレビュー担当（現体制: Claude Code 実装 → Gin 実 UI 確認）が実 UI を読み、**利用者の解釈まで**検証する。
- レビュー単位は**文言ではなく画面状態**。
- 最低確認:
  - 内部スケールが臨床事実として読めないか
  - 相対評価が絶対評価として読めないか
  - モデル区分が承認用量・治療域等と誤認されないか
  - 注意表示とスコア表示が矛盾して見えないか

---

## 5層品質保証体系 + User Decision

Contract → Data → Logic → Presentation → Interpretation → User Decision

| 層 | 名称 |
|---|---|
| L1 | Contract |
| L2 | Data |
| L3 | Logic |
| L4 | Presentation |
| L5 | Interpretation |
| — | User Decision |

注記: L1〜L5 は検証可能な層である。User Decision は検証対象ではなく、drugrep の責任がそこで正しく終わることの明示である。

---

## 71mg Incident 由来記録

- 2026-07-06: 内部モデル（doseBands）が正しくても、UI 語彙（「常用域」）により医学的意味へ誤変換され得ることを、実入力 71mg（承認内）で確認した。
- 対応: 外部意味語彙を撤回し「評価モデル上」の区分であることを明示、Interpretation Validation を品質保証体系の第五層として追加した（本コミットに含む）。
- 関連コミット: doseBands 値の初出 `f5bf255`（2026-04-15）。是正文言・本原則は本コミット。
