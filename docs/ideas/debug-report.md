# 調査メモ: デバッグ報告機能（Prototype限定）

> ステータス: 現時点では実装しない（Post-MVP候補）
> 作成日: 2026-07-06
> 最終照合日: 2026-07-06（`src/types/domain.ts` の `RiskResult` / `src/lib/evaluate.ts` と突き合わせ）

本メモは**設計メモのみ**。コードは書かない・実装しない。Prototype 配布時に限り検討する将来機能の構想。

## 1. 概要

- ユーザーが遭遇した不具合や不自然なスコアを、**再現に足る情報付き**で開発者へ渡すためのデバッグ報告機能。
- **Prototype（限定テスト配布）限定**。一般公開ビルドでは無効化またはビルドから除外する前提。
- **MVP には含めない。** Prototype 限定フラグ付き機能として構想する。

## 2. 動機

- リスク評価は「入力（物質・用量・経路）」と「`RiskResult`」の対応で決まる。バグ再現には *その時の入力と出力* が要る。
- 一方、入力値は §3 のとおりセンシティブ。素朴な「入力をそのまま Issue に貼る」運用は**不可**。この緊張を分離設計（§4）で解く。

## 3. プライバシー原則（最重要）

- **入力値は薬物使用データに該当し得るため、センシティブ情報として扱う。** 実際の使用記録か仮想入力かをアプリは区別できないので、**常にセンシティブ前提**で扱う。
- **匿名が既定。** ニックネームは**任意**入力で、未入力なら匿名。個人識別情報は要求しない。
- **送信前プレビュー必須。** 送信されるペイロード**全体**を、そのままの形でユーザーに提示し、**明示的な同意なしに送信しない**。
- **スクリーンショットの自動取得は禁止。** 画面外・別タブ等の個人情報混入リスクがあるため自動キャプチャはしない。必要時は**ユーザーが手動添付**する運用のみ。
- **公開 GitHub Issue へ入力値を直接載せない。** raw 入力・生 JSON を公開 Issue 本文へ転記しない。

## 4. データ分離: 非公開 report JSON と 公開 Issue 要約

報告データを **2 系統に分離**する。詳細（再現用）は非公開、公開されるのは redacted 要約のみ。

### 4-1. 非公開 report JSON（詳細・非公開チャネル）

- 再現に必要な機械可読データ。**開発者のみアクセスできる非公開チャネル**へ送る（暗号化保管／非公開ストレージ等、具体手段は要確認）。
- 想定フィールド（*2026-07-06 時点*のコードに対応。正は `src/types/domain.ts` / `src/lib/evaluate.ts`）:

  ```
  schemaVersion : string
  createdAt     : ISO8601
  app           : { version, commit, builtAt }
  nickname?     : string | null        // 任意・既定 null（匿名）
  userNote?     : string               // 症状・違和感などユーザー記述（任意）
  input         : { entries: [ { substanceId, dose, route } ] }   // 正規化済みの評価入力
  result        : RiskResult | { errors: FieldError[] }
                  // RiskResult = finalScore / level / breakdown{base,routeFactor,doseFactor,interactionAdd}
                  //              / firedInteractions / warnings / tags / sources
  env?          : { ua, viewport }     // 個人特定に使わない範囲のみ
  ```
- 位置づけ = 「入力 + 出力のスナップショット」。**これは公開しない。**

### 4-2. 公開 Issue 要約（redacted・公開可）

- 公開 GitHub Issue に載せてよい**最小要約**。**raw 入力を含めない。**
- 想定内容: `schemaVersion` / `app.version` + `commit` / 事象カテゴリ / `RiskResult` の**構造的特徴**（例: `level`、`firedInteractions` の `ruleId`、`warnings` の種別）。
  - **具体的な `substanceId` / `dose` は伏字または一般化**するかを要ポリシー確定（§8）。
- 非公開 report JSON への**参照 ID**（開発者が非公開側と突き合わせるためのハンドル）を持たせる。

## 5. report JSON の fixture / golden 昇格

- report JSON は「評価入力と実出力の対応」そのものなので、**匿名化・許諾のうえ fixture / golden test へ昇格可能**。
- 昇格手順（構想）: 個人性のある `nickname` / `userNote` / `env` を除去し、`input` + `result` のみを golden 化。
- 既存 `src/lib/__tests__/evaluate.golden.test.ts` の様式（実測値をリテラル固定）と親和的。
- 効果: バグ報告が**回帰テストへ変換**され、同一バグの再発を検出できる。

## 6. 想定フロー（設計のみ・実装しない）

1. ユーザーが「報告」操作
2. アプリが report JSON を生成
3. **プレビュー画面**で全ペイロードを提示（匿名既定・ニックネーム任意欄）
4. ユーザーが内容を確認し同意
5. 非公開 report JSON を非公開チャネルへ／必要なら公開 Issue 要約（redacted）を発行
6. スクショは自動取得しない（任意の手動添付のみ）

## 7. スコープ / 非対象

- **MVP 非対象。** Prototype 限定フラグでのみ有効化。
- 送信チャネルの実装・認証・保管・保持期間は本メモの対象外（別途要設計）。
- 法務／プライバシーポリシー確認は実装の前提条件（§8）。

## 8. 要確認チェックリスト

- [ ] 非公開チャネルの具体手段（暗号化・保管期間・アクセス制御）
- [ ] 公開要約の一般化レベル（`substanceId` を載せるか完全伏字か）
- [ ] Prototype 限定フラグの実現方法（env / ビルド分岐）
- [ ] golden 昇格時の匿名化手順の明文化
- [ ] プライバシーポリシー／同意文言の整備
- [ ] `schemaVersion` の管理方針（後方互換・移行）
