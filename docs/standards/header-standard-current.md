<!-- Generated from header-standard-v1_6.yaml. Do not edit directly. -->

# 文書ヘッダ規則仕様書（Document Header Standard） v1.6

> 本文書はYAML正本候補から自動生成された可読用副本です。矛盾時はYAMLを優先します。

## 文書情報

| 項目 | 内容 |
|---|---|
| 位置づけ | プロジェクト横断共通規則。判断形式の共通化に該当し、判断内容は含まない。 |
| 適用範囲 | SOS / HNS / drep / BAiOS / Y3D / ProC / 今後開始される全プロジェクト |
| 目的 | 複数プロジェクト並行時の誤配・文脈混入の防止 / 半年後に資料として読み返したときの即時可読性 / 監査時の機械的抽出可能性 |
| 状態 | 発効 |
| 発効日 | 2026-07-14 |
| 配布 | YAMLを正本とし、可読用Markdown副本をYAMLから自動生成する。矛盾時はYAMLを優先する。 |
| Schema version | 1 |
| Canonical format | yaml |
| Derived formats | markdown |
| Conflict precedence | yaml |
| Generation | automatic |

## ヘッダ

```text
【Project】DocType｜ProjectPrefix-Sender より ProjectPrefix-Recipient への文（要約）
```

判別対象: Project / DocType / Sender / Recipient / Summary

### 区切り文字

| キー | 値 |
|---|---|
| project_open | `【` |
| project_close | `】` |
| separator | `｜` |
| recipient_separator | `・` |
| summary_open | `（` |
| summary_close | `）` |
| space | `U+0020` |
| multi_project_separator | `/` |
| role_segment_separator | `-` |

### Project

| 名称 | ID | Prefix | 禁止表記 |
|---|---|---|---|
| SOS（Secretary OS） | SOS | SOS- | SecrtOS, SecOS, SecretaryOS |
| HNS（日ノ本(ひのもと・Hinomoto)国プロジェクト） | HNS | HNS- |  |
| drugrep（物質との適切な関係性管理アプリ） | drep | drep- | drugrep |
| BAiOS（Bootstrapping AI Operating System） | BAiOS | BAiOS- |  |
| Y3D（薬樹ギン3D化プロジェクト） | Y3D | Y3D- |  |
| 全プロジェクト共通 | ProC | — |  |

### DocType

| ID | 日本語 | 用途 |
|---|---|---|
| Decision | 決定 | 方針・仕様の確定通知 |
| Approval | 承認 | 提出物・着手の承認 |
| Review | レビュー | 査読結果・修正指摘 |
| Proposal | 提案 | 新規案・変更案の提示 |
| Request | 依頼 | 作業以外の依頼（確認依頼・情報提供依頼等） |
| Report | 報告 | 成果物提出・状況報告 |
| Discussion | 協議 | 論点整理・意見交換 |
| Notice | 共有 | 決定済み事項・情報の周知 |
| Question | 確認 | 質問・照会 |
| Task | 作業依頼 | 実装・検証等の具体的作業指示 |

Runtime閉集合: `web` / `local`

## 規則

Category閉集合: `structure` / `project` / `doctype` / `spacing` / `role` / `runtime` / `orchestrator` / `authority` / `normalization` / `transition`

Level閉集合: `required` / `prohibited` / `permitted` / `recommended` / `transition`

| Rule ID | Category | Level | 規則 |
|---|---|---|---|
| R-001 | structure | required | ヘッダ1行でProject、DocType、Sender、Recipient、Summaryの5要素をすべて判別可能にする。 |
| R-002 | project | required | Projectは全角隅付き括弧で囲み、projectsのidを正規形として用いる。 |
| R-003 | project | required | リポジトリ名・略称も正式Project識別子に統一する。 |
| R-004 | project | required | 全プロジェクト共通文書は【ProC】を用いる。 |
| R-005 | project | required | 特定の複数Projectは半角スラッシュで連結し、全Projectの場合は列挙せず【ProC】を用いる。 |
| R-006 | doctype | required | DocTypeはdoc_typesの10種から一つを省略・略号なしで選ぶ。追加はGin裁定事項とする。 |
| R-007 | doctype | required | 複数の性質を持つ文書は主目的でDocTypeを一つ選ぶ。 |
| R-008 | structure | required | 区切りは全角パイプU+FF5Cだけを正とし、チルダおよび半角パイプを認めない。 |
| R-009 | spacing | required | Sender、固定語『より』、Recipient、固定語『への文』の各境界に半角スペースU+0020を1文字置く。 |
| R-010 | spacing | prohibited | 全角スペース、タブ、スペースなし、連続する複数スペースを正規形としない。 |
| R-011 | role | required | SenderおよびRecipientはProjectPrefix-RoleID[-Runtime]を正規形とし、Runtimeは必要時のみ末尾に付ける。 |
| R-012 | role | required | Role IDは半角ラテン文字の役割識別子であり、モデル名ではない。担当モデル変更時も継続利用する。 |
| R-013 | role | permitted | 同一Projectで複数Role IDを同時にActive運用でき、Activeは非排他的である。 |
| R-014 | role | prohibited | Registry未掲載だけを理由に正式使用実績のあるRole IDを不存在・無効・使用禁止と判定しない。同期漏れ候補として報告し、Gin裁定または既存運用記録を確認する。 |
| R-015 | runtime | required | Runtimeは文書単位の実行環境識別情報であり、閉集合web/localのみを正規形とする。追加はGin裁定事項とする。 |
| R-016 | runtime | prohibited | モデル名、サービス名、ベンダー名をRuntimeに使用しない。 |
| R-017 | runtime | permitted | Runtime省略は区別不要時の正規形である。RecipientのRuntime指定時はそのインスタンスのみ、省略時は同じRole IDの全Runtimeを対象とする。 |
| R-018 | runtime | prohibited | Runtimeだけが異なる同一Role IDを独立検証者とみなさない。独立検証性の規範は各Projectの品質規則に従う。 |
| R-019 | orchestrator | required | OrchestratorはProject横断の統括・裁定主体で、現行運用ではGinである。Role IDおよびRole Registryの枠外とし、Project Prefixなしで表記する。 |
| R-020 | spacing | required | OrchestratorがSenderまたはRecipientでも固定語との境界に半角スペースU+0020を1文字置く。 |
| R-021 | role | required | 複数Recipientは全角中黒で連結し、中黒の前後にスペースを置かない。 |
| R-022 | role | recommended | 複数Recipientは作業担当者を先頭、共有・待機者を後置する。違反判定対象外とする。 |
| R-023 | role | required | 【ProC】以外のProject所属Role IDにはProject Prefixを必須とする。複数Project文でも各Role IDに所属ProjectのPrefixを付ける。 |
| R-024 | role | required | 【ProC】の文責主体となる横断Role IDにはPrefixを付けないが、Recipientとして各Project所属Role IDを記載する場合はPrefixを付ける。proc-は設けない。 |
| R-025 | role | permitted | Prefixを省略できるのはOrchestratorと【ProC】文書の横断Role IDだけである。 |
| R-026 | structure | required | Summaryは全角丸括弧で囲み、対象物識別子を含め、ヘッダのみで対象を特定できる粒度にする。 |
| R-027 | normalization | permitted | Project識別子、Prefix、Role ID、Runtime、Orchestrator表記は半角英数である限り大小文字を同一視する。 |
| R-028 | normalization | prohibited | 大小文字以外の全角英数、識別子の揺れ、構造違反、Role IDの仮名・漢字表記は許容しない。 |
| R-029 | normalization | recommended | AI出力は常に正規形へ統一し、人間入力は大小文字を許容して記録時に正規化する。 |
| R-030 | normalization | required | 検索はcase-insensitiveを標準とする。 |
| R-031 | authority | required | DecisionおよびApprovalのSenderはOrchestratorに限る。 |
| R-032 | authority | prohibited | AIプロセスはDecisionおよびApprovalを発行せず、Gin判断待ちへ隔離して発行を待つ。 |
| R-033 | authority | prohibited | AIプロセスがOrchestrator名義で文書を発行することを禁止する。 |
| R-034 | transition | transition | 半角スペース規則の発効前文書は旧形式も履歴上有効とし、新規作成、再掲、正規化保存では現行正規形を用いる。過去文書の一括修正は不要で、引用は原文保持を優先する。 |

## 例

### 正例

- `【HNS】Review｜HNS-Crd より HNS-Rev への文（分類軸資産 第2バッチへの回答）`
- `【SOS】Proposal｜SOS-Rev より Gin への文（推論資産構成案）`
- `【drep】Approval｜Gin より drep-Crd への文（Task5C実装着手）`
- `【SOS/HNS】Notice｜HNS-Crd より Gin・SOS-Rev・HNS-Rev への文（並行運用方針共有）`
- `【ProC】Notice｜Crd より Gin・SOS-Rev・HNS-Rev・drep-Imp への文（ヘッダ規則v1.4配布）`
- `【Y3D】Decision｜Gin より Y3D-Rev・Y3D-Crd への文（確認事項裁定）`
- `【drep】Question｜Gin より drep-Crd への文（返信テスト）`
- `【drep】Report｜drep-Crd より Gin への文（返信テストへの応答）`

### 違反例

| 例 | 違反Rule ID |
|---|---|
| `【HNS】[Review]HNS-Crd から HNS-Rev へ（CX-001修正）` | R-001, R-008 |
| `【HNS】RV｜HNS-Crdより HNS-Rev への文（CX-001修正）` | R-006, R-009 |
| `【HNS】Review~HNS-Crd より HNS-Rev への文（…）` | R-008 |
| `【HNS】Review｜Crdより Rev への文（…）` | R-009, R-023 |
| `【SecOS】Review \|Gin to SOS-Rev（…）` | R-002, R-008, R-009 |
| `【drugrep】Report｜drep-Crd より Ginへの文（…）` | R-002, R-009, R-020 |
| `【ＳＯＳ】Report｜SOS-Revより Ginへの文（…）` | R-028, R-009, R-020 |
| `【drep】Report｜drep-チャッピーより Ginへの文（…）` | R-012, R-009, R-020 |
| `【drep】Report｜drep-web-Impより Ginへの文（…）` | R-015, R-009, R-020 |
| `【drep】Report｜drep-Imp-mobileより Ginへの文（…）` | R-015, R-009, R-020 |
| `【drep】Report｜drep-Imp-[ChatGPT]より Ginへの文（…）` | R-016, R-009, R-020 |
| `【HNS】Review｜HNS-Crdより HNS-Revへの文（…）` | R-009 |
| `【HNS】Review｜HNS-Crd　より HNS-Rev　への文（…）` | R-010 |
| `【HNS】Review｜HNS-Crd  より HNS-Rev  への文（…）` | R-010 |
| `【drep】Question｜Ginより drep-Crd への文（…）` | R-009, R-020 |
| `【drep】Report｜drep-Crd より Ginへの文（…）` | R-009, R-020 |
| `【drep】Approval｜drep-Crd より drep-Rev への文（Task5C実装着手）` | R-031 |
| `【SOS】Decision｜Gin より SOS-Rev への文（…）※実際の発行者がAIプロセスの場合` | R-033 |

## 本文構造規則

- 裁定を要する項目は本文末尾の【Gin判断待ち — 隔離】見出し下へ番号付きで隔離する。
- 裁定は「採用」「保留（Deferred）」「非採用を決定」のいずれかを明示し、曖昧な表現を禁止する。

## 違反時の運用

- 違反文書の受信者は内容処理前に差し戻す。
- 差し戻し文のDocTypeはReviewとし、違反箇所を違反類型で指摘する。
- 違反が反復される場合はGinへNoticeで報告する。

## 検討済み・非採用の代替案

| 案 | 判定 | 理由 |
|---|---|---|
| [docCat]角括弧区切り | 非採用 | 【Project】と視覚競合し読みにくい |
| チルダ・その他記号区切り | 非採用 | 全角パイプが検索性・視認性で優位 |
| 略号DocType（[RV]等） | 非採用 | 将来の可読性・監査性を損なう |
| 機械可読ヘッダ（Type:/From:/To:/Title:の複数行形式） | 非採用（記録保持） | 機械可読性は高いが人間には冗長。将来ツール処理が必要な場合の再検討候補 |
| Project Prefix proc-（ProC解釈案2） | 非採用を決定（v1.2） | proc-という所属は実体を持たず、横断性は【ProC】で表現する |
| Runtime角括弧記法 | 非採用 | 【Project】と視覚競合しRole ID正規形との境界が不明確 |
| Runtime @記法 | 非採用 | 既存ヘッダにない記号体系を追加する |
| 本文冒頭Runtime:行 | 非採用 | ヘッダ1行で5要素を判別する原則を損なう |
| Role ID改名案 | 非採用 | 検索系統を二重化し過去ログ・台帳・仕様書との接続を断つ |
| Gin登録案 | 非採用 | GinはOrchestratorでRole IDの枠外 |
| Orchestrator登録案 | 非採用 | Registry責務の混在と裁定の自己参照を避ける |

## 版管理

| 版 | 日付 | 変更 |
|---|---|---|
| v0.1 | 2026-07-07 | 初版作成（sos-Fable）。Gin・Chappy間の協議結果を仕様化 |
| v1.0 | 2026-07-07 | 発効。配布方法、正式識別子、旧識別子違反類型、ProC規則付録案を反映 |
| v1.1 | 2026-07-07 | 大小文字同一視、AI正規形出力、入力寛容・記録正規化、case-insensitive検索を追加 |
| v1.2 | 2026-07-07 | 【ProC】を採用し本文へ統合、proc-を非採用 |
| v1.3 | 2026-07-09 | Role ID継続原則、Runtime、Orchestrator、Role Registry、Recipient順序推奨を追加 |
| v1.4 | 2026-07-11 | Active非排他、Registry同期漏れ、BAiOS・Y3D、Prefix規則、Role ID追加と旧Role Frozenを反映 |
| v1.4追補 | 2026-07-11 | 固定語境界の半角スペース1文字と経過措置を追加 |
| v1.4追補2 | 2026-07-11 | Orchestratorにも半角スペース規則を適用 |
| v1.5 | 2026-07-12 | Decision・ApprovalのOrchestrator限定とOrchestrator偽装禁止を復活明文化 |
| v1.6 | 2026-07-14 | YAML正本化、Markdown副本の自動生成、Rule ID、規範強度、違反例からRule IDへの参照を追加し、Gin裁定により発効 |

## Role Registry

全プロジェクト共通Role IDの実在性および状態を管理する規範情報源

### 限界

- 保証対象はRole IDの実在性までで、Project PrefixとRole IDの組合せは各Project側で管理する。
- RuntimeとOrchestratorは管理対象外とする。
- Activeは非排他的である。
- 未掲載だけを理由に正式使用実績のあるRole IDを無効化しない。
- 登録日はRegistry管理開始日であり、制定日または使用開始日を意味しない。

### 状態

| 状態 | 定義 |
|---|---|
| Active | 現に使用中。非排他的状態。 |
| Frozen | 新規文書での使用は停止するが、過去文書と既存資産の参照解決のため保持する。 |
| Retired | 役割を廃止した状態。Role IDの再利用を禁止する。 |

### エントリ

| Role ID | 役割原型 | 状態 | 登録日 | 後継 |
|---|---|---|---|---|
| Claude | 実装・技術支援系 | Frozen | 2026-07-09 | Imp |
| Fable | レビュー・査読系 | Frozen | 2026-07-09 | Rev |
| Chappy | 調整・統合支援系 | Frozen | 2026-07-09 | Crd |
| Rev | 独立レビュー・検証・品質保証系 | Active | 2026-07-11 | — |
| Crd | 調整・進行・実装統括系 | Active | 2026-07-11 | — |
| Ppl | パイプライン実行・自動化・運用支援系 | Active | 2026-07-11 | — |
| Imp | 実装・技術運用支援系 | Active | 2026-07-11 | — |

### 更新規則

- 更新はGin裁定のみで実施可能とする。
- 内容更新は本文改訂と独立して裁定できるが、正本更新時はRegistry更新履歴または版管理へ記録し、同一版の無履歴上書きを禁止する。
- 状態変更履歴への記録を必須とし、履歴なき更新は無効とする。
- 正式運用実績のある未掲載Role IDはGinへNoticeまたはProposalで報告し、裁定後に登録日と状態変更履歴を追記する。

## Gin判断待ち — 隔離

（新規なし）

### 解消済み

- v0.1判断待ち1〜3：2026-07-07裁定で解消
- 大小文字規則：v1.1へ統合済み
- ProC解釈：2026-07-07裁定で案1を採用しv1.2へ統合済み
- v1.4発効承認：2026-07-11裁定で解消
- v1.6発効承認：2026-07-14 Gin裁定で解消
