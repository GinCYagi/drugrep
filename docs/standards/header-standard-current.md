# 文書ヘッダ規則仕様書（Document Header Standard）v1.4

- **位置づけ**: プロジェクト横断共通規則。「判断形式の共通化」に該当し、判断内容（各プロジェクトの思想・用語・成果物）は一切含まない。
- **適用範囲**: SOS / HNS / drep / BAiOS / Y3D / ProC（全プロジェクト共通）の全伝達文、および今後開始される全プロジェクト。
- **目的**: (1) 複数プロジェクト並行時の誤配・文脈混入の防止、(2) 半年後に資料として読み返したときの即時可読性、(3) 監査時の機械的抽出可能性。
- **状態**: **発効**
- **現在版**: v1.4追補2
- **発効日**: 2026-07-11
- **配布方法**: 原文（本.md）掲示（Gin裁定）

---

## 1. 基本形式

```
【Project】DocType｜ProjectPrefix-Sender より ProjectPrefix-Recipient への文（要約）
```

ヘッダ1行で以下の5要素がすべて判別できることを要件とする。

| # | 要素 | 例 |
|---|------|----|
| 1 | プロジェクト | 【Prj】 | 
| 2 | 文書種別 | Review |
| 3 | 発信者 | Prj-Crd | 
| 4 | 受信者 | Prj-Rev | 
| 5 | 要約 | （CX-001修正） |



## 2. 要素定義

### 2.1 【Project】
- 全角隅付き括弧【】でプロジェクト識別子を囲む。
- **正式識別子（Gin裁定・2026-07-11確定）**:

| プロジェクト | 正式識別子 | Project Prefix | 使用禁止の旧表記・揺れ |
|--------------|-----------|---------------------|------------------------|
| SOS（Secretary OS） | **SOS** | SOS- | SecrtOS, SecOS, SecretaryOS |
| HNS（日ノ本(ひのもと・Hinomoto)国プロジェクト） | **HNS** | HNS- | — |
| drugrep（物質との適切な関係性管理アプリ） | **drep** | drep- | drugrep（ヘッダ内での使用） |
| BAiOS（Bootstrapping AI Operating System） | **BAiOS** | BAiOS- | — |
| Y3D（薬樹ギン3D化プロジェクト） | **Y3D** | Y3D- | — |
| 全プロジェクト共通 | **ProC**（Project Common） | なし（2.4参照） | — |
<!--
|  |  |  | — |
-->

- リポジトリ名・略称もこの識別子に統一する（Gin裁定）。
- 表中の識別子は**正規形**（記録・引用・AI出力で用いる形）である。入力時の照合は2.6の規則による（ProC / proc / PROC はいずれも有効）。
- **全プロジェクト共通の文書**（本仕様書の配布、横断運用方針の共有等）は 【ProC】 を用いる（v1.2確定・Gin裁定）。
- **特定の複数プロジェクト**にまたがる共有文は「/」で連結する。例: 【SOS/HNS】。全プロジェクトに及ぶ場合は列挙ではなく【ProC】を用いる。

### 2.2 DocType（文書種別）
- 第3章の10種から選択する。**省略・略号は禁止**（例: `[RV]` は不可）。
- 理由: 略号は将来「RVって何だっけ？」となるリスクがあり、監査性・保守性の観点で英単語または日本語をそのまま使うことが有利であるため。

### 2.3 区切り文字「｜」
- **全角パイプ（vertical bar, U+FF5C）** のみを正とする。
- チルダ（~）ではない。半角パイプ（|）でもない。
- 採用理由:
  1. 【Project】と視覚的に干渉しない
  2. 「より」「への文」との境界が明確
  3. 全角であり日本語文書に馴染む
  4. Markdown・プログラムの `|` と混同しにくい
  5. 後からの検索時に「】DocType｜」パターンで機械的に抽出できる
- 旧検討案 `[docCat]`（角括弧）は、【Project】と視覚的に競合し可読性を下げるため**非採用を決定**した記録とする。

### 2.4 発信者・受信者（Role ID）

- Sender、固定語「より」、Recipient、固定語「への文」の境界には、半角スペース（U+0020）を1文字ずつ配置する。
- 正規形は次のとおりとする。

  `ProjectPrefix-Sender より ProjectPrefix-Recipient への文`

- 半角スペースの配置位置は次の3か所とする。
  1. Senderの直後
  2. 「より」の直後
  3. Recipientの直後
- 「より」の直前および「への文」の直前には、上記規則により半角スペースを置く。
- 全角スペース、タブ、スペースなし、連続する複数スペースは正規形としない。
- 形式は `Project Prefix-Role ID（-Runtime：必要時のみ）` とする。
- Project Prefixの正規形は2.1の表に従う。原則として大文字表記とするが、Gin裁定により `drep-` および `BAiOS-` は表記上の正規形とする。`ProC`にはProject Prefixを設けない。
- 正規形の例：`SOS-Rev` / `SOS-Imp` / `HNS-Rev` / `HNS-Crd` / `drep-Imp` / `BAiOS-Crd` / `Y3D-Ppl`。大小文字の照合は2.6による。
- Role IDは半角ラテン文字を正規形とする。
- **Role IDはモデル名ではない。** 担当モデルが変更された場合もRole IDは変更せず、役割識別子として継続利用する（HNS裁定済みの原則を横断適用）。
- この継続性には、同一の判断基準・同一の資産構造・同一のヘッダ規則を維持することを含む。
- 同一プロジェクト内で、複数のRole IDを同時に有効運用してよい。Role Registryの状態 `Active` は非排他的であり、あるRole IDがActiveであることは、他のRole IDの状態または実在性を意味しない。
- Role Registryに未掲載であることのみを理由として、正式文書で使用実績のあるRole IDを不存在・無効・使用禁止と判定してはならない。未掲載を検出した場合はRegistry同期漏れ候補として報告し、Gin裁定または既存運用記録を確認する。
- Runtime識別は、文書単位の実行環境識別情報である。形式は `Project Prefix-Role ID-Runtime` とする。
- Runtime語彙は閉集合とし、`-web`／`-local`のみを正規形とする。Runtime語彙の追加はGin裁定事項とする。モデル名・サービス名・ベンダー名はRuntime値として使用してはならない。
- Runtimeは、同時稼働時または識別が必要な場合のみ付与する。Runtime省略は違反ではなく、区別不要時の正規形とする。
- RecipientにRuntimeが付与されている場合、当該Runtimeインスタンスのみを受信対象とする。Runtime省略時は、同一Role IDの全Runtimeを受信対象とする。
- Runtimeのみ異なる同一Role IDは、独立検証者とは見なさない。
  - ○ 独立検証：実装 `drep-Imp`／検証 `drep-Rev`
  - × 独立検証ではない：実装 `drep-Imp-web`／検証 `drep-Imp-local`
  - 注記：独立検証性の規範は、各プロジェクトの品質規則に従う。
- Orchestratorは、プロジェクト横断の統括・裁定主体である。現行運用ではGinが該当する。OrchestratorはRole IDの枠外とする。ヘッダではProject Prefixなしの呼称で表記する。Orchestrator表記には2.6の照合規則を適用する。
- OrchestratorがSenderまたはRecipientとして記載される場合も、固定語との境界には半角スペース（U+0020）を1文字ずつ配置する。
  - Senderの場合：`Gin より ProjectPrefix-Recipient への文`
  - Recipientの場合：`ProjectPrefix-Sender より Gin への文`
  - 複数Recipientの一部である場合：`ProjectPrefix-Sender より Gin・ProjectPrefix-Recipient への文`
- Orchestrator表記と全角中黒「・」の間にはスペースを置かない。
- 受信者が複数の場合は、全角中黒「・」で連結する。例：`Gin・SOS-Rev・SOS-Imp`
- 受信者が複数の場合の並び順は、作業担当者を先頭とし、共有・待機者を後置することを推奨する（推奨であり、違反判定の対象とはしない）。
- **Project Prefixは、【ProC】を除くすべてのプロジェクト所属Role IDに必須とする。**
- 単一プロジェクト文だけでなく、【SOS/HNS】等の複数プロジェクトにまたがる列挙型共有文でも、SenderおよびRecipientには、それぞれ所属するプロジェクトのProject Prefixを付与しなければならない。
  - 例：`【SOS/HNS】Notice｜SOS-Crd より Gin・SOS-Rev・HNS-Rev への文（並行運用方針共有）`
- 【ProC】文書では、`proc-`というProject Prefixを設けないため、ProCの文責主体となるRole IDはProject Prefixなしで表記する。
  - 例：`【ProC】Notice｜Crd より Gin・SOS-Rev・HNS-Rev・drep-Imp への文（共通規則配布）`
- 【ProC】文書のRecipientとして各プロジェクト所属Role IDを記載する場合は、所属および文責を識別するため、各Role IDにProject Prefixを付与しなければならない。
- Project Prefixを省略できるのは、次のいずれかに限る。
  1. Role IDの枠外であるOrchestrator
  2. 【ProC】文書の文責主体として表記する横断Role ID
- 注：`proc-`というProject Prefixは設けない（解釈案2は非採用――第7章）。各プロジェクト所属Role IDの所属はProject Prefixで示し、全プロジェクト共通文書であることはプロジェクト欄【ProC】で表現する。

#### 2.4.1 半角スペース規則の経過措置

- 本半角スペース規則の発効前に作成された文書については、Sender・「より」・Recipient・「への文」の間に半角スペースを置かない旧形式も、履歴上有効とする。
- 本半角スペース規則の発効後に新規作成する文書、再掲する文書、正規化して保存する文書では、半角スペース付きの正規形を使用する。
- 過去文書を本半角スペース規則への適合のみを目的として一括修正する必要はない。
- 過去文書を引用する場合は、原文保持を優先する。正規化して再掲する場合は、現行正規形へ整える。

### 2.5 （要約）
- 全角丸括弧（）で内容の一行要約を記す。
- 対象物の識別子（CX-001、Task5C、第2バッチ等）を含め、ヘッダのみで対象が特定できる粒度とする。

### 2.6 識別子の照合規則（大小文字の扱い）— v1.1新設・Gin裁定

- **照合規則: プロジェクト識別子・Project Prefix・Role ID・Runtime・Orchestrator表記は、半角英数である限り大小文字を同一視して有効とする。**
  - 有効例: 【SOS】【sos】【Sos】、【drep】【DREP】、SoS-Rev / SOS-Rev / Sos-Rev
- 正規形は、Project識別子およびProject Prefixともに2.1の表に従う。Project Prefixは原則大文字表記とするが、`drep-`および`BAiOS-`はGin裁定による表記上の例外とし、`ProC`にはProject Prefixを設けない。これらの例外は視覚上の選好によるものであり、権限・意味・状態の差を示さない。
- **採用理由**: 人間の打鍵環境・身体条件によりShift操作のコストが高い場面があるため（Gin裁定・2026-07-07）。入力コストは正当な設計制約であり、可読性境界であるヘッダは、権限境界（承認判定等）と同じ厳密性を要求しない。
- **違反のまま残るもの**（大小文字以外は緩和しない）:
  1. 全角英数（ＳＯＳ 等）
  2. 識別子自体の揺れ（SecOS、SecrtOS、SecretaryOS、drugrep）
  3. 構造違反（区切り文字誤り、prefix欠落、略号DocType 等）
  4. Role IDの仮名・漢字表記（例: チャッピー、ファブル等）
- **AI発信者の自己規律（推奨・違反扱いではない）**: AI側は打鍵コストがゼロであるため、出力は常に2.1で定める正規形（【SOS】【HNS】【drep】【BAiOS】【Y3D】【ProC】、Project Prefixは原則大文字。ただし `drep-`・`BAiOS-` はGin裁定による例外）に統一する。人間は楽に書き、記録・資産へ引用される段階では正規形に揃う「**入力寛容・記録正規化**」の二層構造とする。
- **検索への注記**: 本規則の帰結として、ヘッダの機械的抽出は **case-insensitive検索を標準**とする。AI出力が正規形に統一されている限り、実務上の検索精度は維持される。

## 3. DocType一覧（10種・固定）

| DocType | 日本語 | 用途 |
|---------|--------|------|
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

- この10種で十分とし、**新規種別の追加はGin裁定事項**とする。
- 1文書1種別。複数性質を持つ文は主目的で選ぶ（例: 承認+次工程指示 → Approval）。

## 4. 記法例

正:

```
【HNS】Review｜HNS-Crd より HNS-Rev への文（分類軸資産 第2バッチへの回答）
【SOS】Proposal｜SOS-Rev より Gin への文（推論資産構成案）
【drep】Approval｜drep-Crd より drep-Rev への文（Task5C実装着手）
【SOS/HNS】Notice｜HNS-Crd より Gin・SOS-Rev・HNS-Rev への文（並行運用方針共有）
【ProC】Notice｜Crd より Gin・SOS-Rev・HNS-Rev・drep-Imp への文（ヘッダ規則v1.4配布）
【Y3D】Decision｜Gin より Y3D-Rev・Y3D-Crd への文（確認事項裁定）
【drep】Question｜Gin より drep-Crd への文（返信テスト）
【drep】Report｜drep-Crd より Gin への文（返信テストへの応答）
【ProC】Notice｜Crd より Gin・SOS-Rev・HNS-Rev への文（共通規則配布）

```

誤（違反類型）:

```
【HNS】[Review]HNS-Crd から HNS-Rev へ（CX-001修正）	← 角括弧区切り
【HNS】RV｜HNS-Crdより HNS-Rev への文（CX-001修正）		← 略号
【HNS】Review~HNS-Crd より HNS-Rev への文（…）			← チルダ区切り
【HNS】Review｜Crdより Rev への文（…）					← 単一プロジェクト文でprefix欠落
【SecOS】Review |Gin to SOS-Rev（…）					← 識別子の揺れ（正: SOS）+ 半角パイプ ※大小文字は違反ではない（2.6）
【drugrep】Report｜drep-Crd より Ginへの文（…）		← 旧識別子（正: 【drep】）
【ＳＯＳ】Report｜SOS-Revより Ginへの文（…）			← 全角英数（2.6により違反のまま）
【drep】Report｜drep-チャッピーより Ginへの文（…）		← カタカナRole ID（Role ID本体は半角ラテン文字）
【drep】Report｜drep-web-Impより Ginへの文（…）		← Runtime位置誤り（正: drep-Imp-web）
【drep】Report｜drep-Imp-mobileより Ginへの文（…）		← Runtime語彙外（正規Runtimeは -web / -local の閉集合）
【drep】Report｜drep-Imp-[ChatGPT]より Ginへの文（…）	← モデル名Runtime（角括弧記法自体も非採用記法）
【HNS】Review｜HNS-Crdより HNS-Revへの文（…）			← Sender・Recipient境界の半角スペース欠落
【HNS】Review｜HNS-Crd　より HNS-Rev　への文（…）		← 全角スペース使用
【HNS】Review｜HNS-Crd  より HNS-Rev  への文（…）		← 半角スペースが複数
【drep】Question｜Ginより drep-Crd への文（…）			← Orchestrator直後の半角スペース欠落
【drep】Report｜drep-Crd より Ginへの文（…）			← Orchestrator直後の半角スペース欠落
```

## 5. 本文構造規則（ヘッダに付随する共通規則）

1. **Gin判断待ち項目の末尾隔離**: 裁定を要する項目は本文末尾に「【Gin判断待ち — 隔離】」見出しの下へ番号付きで隔離し、本文中に紛れ込ませない。
2. **裁定の三値明示**: 裁定は「採用」「保留（Deferred）」「非採用を決定」のいずれかを明示する。「非採用（承認）」のような、保留か却下か曖昧になる表現は禁止する。

## 6. 違反時の運用

- ヘッダ規則違反の文書を受信した者は、**内容の処理に入る前に差し戻す**（プロジェクト思想混入時の衝突検出差し戻しと同一の運用）。
- 差し戻し文のDocTypeはReviewとし、違反箇所を第4章の違反類型で指摘する。
- 違反が反復される場合、Ginへ Notice で報告する。

## 7. 検討済み・非採用の代替案（監査記録）

| 案 | 判定 | 理由 |
|----|------|------|
| `[docCat]` 角括弧区切り | 非採用 | 【Project】と視覚競合し読みにくい |
| チルダ・その他記号区切り | 非採用 | 全角パイプが検索性・視認性で優位 |
| 略号DocType（[RV]等） | 非採用 | 将来の可読性・監査性を損なう |
| 機械可読ヘッダ（Type:/From:/To:/Title: の複数行形式） | 非採用（記録保持） | 機械可読性は高いが人間には冗長。将来ツール処理の必要が生じた場合の再検討候補として記録のみ残す |
| Project Prefix proc-（ProC解釈案2） | 非採用を決定（v1.2） | Role IDの所属は各プロジェクトで定義され、proc-という所属は実体を持たない。横断性はプロジェクト欄【ProC】で表現（解釈案1採用） |
| Runtime角括弧記法（例: drep-Imp[web]） | 非採用 | ヘッダ構造内に角括弧記法を追加すると【Project】との視覚競合を生み、Role ID正規形との境界が不明確になる |
| Runtime @記法（例: drep-Imp@web） | 非採用 | RuntimeはRole IDのハイフンサフィックスとして扱う。@記法は既存ヘッダ構造に存在しない記号体系を追加するため採用しない |
| 本文冒頭Runtime:行 | 非採用 | Runtime識別はヘッダ内の文書単位識別情報として扱う。本文冒頭行へ分離すると、ヘッダ1行で5要素を判別する原則を損なう |
| Role ID改名案 | 非採用 | 既存名を改名すると検索系統が二重化し、過去ログ・台帳・仕様書との接続が断絶して監査性を劣化させる |
| Gin登録案 | 非採用 | GinはOrchestratorであり、Role IDの枠外とする。Role Registryの管理対象には含めない |
| Orchestrator登録案 | 非採用 | Registry責務の混在防止、裁定の自己参照回避のため非採用。役割ベースで管理対象外とすることで、担当主体変更時もRegistry改訂を不要とする |

## 8. 版管理

| 版 | 日付 | 変更 |
|----|------|------|
| v0.1 | 2026-07-07 | 初版作成（sos-Fable）。Gin・Chappy間の協議結果を仕様化 |
| v1.0 | 2026-07-07 | 発効（Gin承認）。裁定反映: 配布方法=原文掲示、正式識別子=SOS/HNS/drep確定、旧識別子を違反類型へ追加、ProC規則を付録Aとして起草（解釈確定待ち） |
| v1.1 | 2026-07-07 | 2.6新設（Gin裁定）: 識別子の大小文字は半角英数の範囲で同一視。AI出力の正規形統一（入力寛容・記録正規化）、case-insensitive検索標準を追記。違反類型例を整合修正 |
| v1.2 | 2026-07-07 | ProC確定（Gin裁定）。解釈案1（プロジェクト識別子【ProC】）を採用し2.1・2.4へ統合、解釈案2（proc-プレフィックス）は非採用を決定し第7章へ記録。旧付録Aは本文統合により削除（内容は2.1・2.4・7章に分散保持） |
| v1.3 | 2026-07-09 | Role ID定義を正式化し、担当モデル変更時もRole IDを継続する原則を明文化。Runtime識別（-web / -local）およびOrchestrator定義を新設。Role Registryを付録Aとして新設。Runtime表記案・Role ID改名案・Gin登録案・Orchestrator登録案の非採用記録を追加。第5章「役割の連続性」を2.4へ統合。Recipient並び順推奨規則を追加 |
| v1.4 | 2026-07-11 | Role RegistryのActiveを非排他的状態として明文化。Registry未掲載とRole不存在を分離。正式運用実績がある未掲載Roleを同期漏れ候補として扱う規則を追加。BAiOS・Y3Dの正式識別子およびProject Prefixを追加。複数プロジェクト横断文でも所属Project Prefixを必須化。Project Prefixは原則大文字表記を正規形とし、`drep-`・`BAiOS-`をGin裁定による例外、ProCをPrefixなしとした。Role ID Rev／Crd／Ppl／Impを追記。Claude／Fable／ChappyをFrozenに変更し、後継Role IDをImp／Rev／Crdとして記録 |
| v1.4追補 | 2026-07-11 | Sender・「より」・Recipient・「への文」の境界に半角スペース1文字を置く正規形へ変更。発効前文書の旧形式は履歴上有効とし、一括修正を不要とする経過措置を追加。 |
| v1.4追補2 | 2026-07-11 | OrchestratorがSenderまたはRecipientとなる場合にも、固定語「より」「への文」との境界へ半角スペース1文字を配置することを明文化。 |

- 本仕様書の改訂はGin裁定を必須とする。改訂提案はProposalとして提出する。

---

## Appendix A Role Registry

### A-1 目的と限界

本Registryは、全プロジェクト共通のRole IDの実在性および状態を管理する規範情報源である。

本Registryが保証するのはRole IDの実在性までであり、Project PrefixとRole IDの組合せ（例：HNS-Imp）の有効性は各プロジェクト側で管理する。

Runtime識別は文書単位の実行環境識別情報であり、本Registryでは保持しない。

本RegistryはRole IDのみを管理対象とし、Orchestrator（2.4）は管理対象外とする。

`Active`はRole ID単位の非排他的状態である。同一プロジェクトまたは複数プロジェクトにおいて、複数のRole IDが同時にActiveであってよい。

正式文書でSenderまたはRecipientとして使用されたRole IDが本Registryに未掲載である場合、未掲載のみを理由としてRole不存在・無効・使用禁止と判定してはならない。既存運用記録またはGin裁定を確認し、Registry同期漏れ候補として扱う。

本Registry発効前から運用されていたRole IDについては、本Registryへの登録日はRegistry管理開始日を示すものであり、Role IDの制定日または使用開始日を意味しない。登録日以前の使用は、本Registry発効前の運用として有効とする。

### A-2 エントリ様式

| 項目 | 区分 | 記載規則 |
|---|---|---|
| Role ID | 規範 | 半角ラテン文字。2.6の照合規則（大小文字同一視）を適用する。 |
| 役割原型 | 規範 | プロジェクト横断の役割原型を1行で記載する。詳細責務は各プロジェクト文書で管理する。 |
| 状態 | 規範 | Active／Frozen／Retired（状態定義による）。 |
| 登録日 | 規範 | YYYY-MM-DDおよび根拠裁定文書ヘッダを記載する。 |
| 状態変更履歴 | 規範 | 日付・変更内容・裁定参照を追記方式で記録する。 |
| 備考 | 参考 | Role ID固有の参考情報のみ記載する。規則・定義・注釈の再掲は禁止する。 |

状態定義
- Active：現に使用中。非排他的状態であり、他のRole IDも同時にActiveとなり得る。
- Frozen：新規文書での使用は停止するが、過去文書および既存資産の参照解決のため保持する。
- Retired：役割を廃止した状態。Role IDの再利用は禁止する。

履歴欄記載規則

裁定参照は、裁定文書ヘッダの正式識別子（要約を含む）を用いる。

### A-3 Role Registry

**Role ID：Claude**

| 項目 | 内容 |
|---|---|
| Role ID | Claude |
| 役割原型 | 実装・技術支援系 |
| 状態 | Frozen |
| 登録日 | 2026-07-09（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知）） |
| 状態変更履歴 | 2026-07-09 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知））。<br>2026-07-11 ActiveからFrozenへ変更。新規文書での使用を停止し、過去文書および既存資産の参照解決のため保持。後継Role IDはImp。旧Role IDを使用していたプロジェクトの保守・新規機能追加はImpを用いて実施する。（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | 後継Role ID：Imp。 |

**Role ID：Fable**

| 項目 | 内容 |
|---|---|
| Role ID | Fable |
| 役割原型 | レビュー・査読系 |
| 状態 | Frozen |
| 登録日 | 2026-07-09（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知）） |
| 状態変更履歴 | 2026-07-09 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知））。<br>2026-07-11 ActiveからFrozenへ変更。新規文書での使用を停止し、過去文書および既存資産の参照解決のため保持。後継Role IDはRev。旧Role IDを使用していたプロジェクトの保守・新規機能追加はRevを用いて実施する。（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | 後継Role ID：Rev。 |

**Role ID：Chappy**

| 項目 | 内容 |
|---|---|
| Role ID | Chappy |
| 役割原型 | 調整・統合支援系 |
| 状態 | Frozen |
| 登録日 | 2026-07-09（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知）） |
| 状態変更履歴 | 2026-07-09 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（役割名規則および実行環境識別方式に関する裁定通知））。<br>2026-07-11 ActiveからFrozenへ変更。新規文書での使用を停止し、過去文書および既存資産の参照解決のため保持。後継Role IDはCrd。旧Role IDを使用していたプロジェクトの保守・新規機能追加はCrdを用いて実施する。（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | 後継Role ID：Crd。 |


**Role ID：Rev**

| 項目 | 内容 |
|---|---|
| Role ID | Rev |
| 役割原型 | 独立レビュー・検証・品質保証系 |
| 状態 | Active |
| 登録日 | 2026-07-11（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 状態変更履歴 | 2026-07-11 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | Reviewerの略。Fableの後継Role IDとして登録するが、Fableとは別個のRole IDであり、同一視しない。正式文書での継続運用実績を根拠に遡及登録。 |

**Role ID：Crd**

| 項目 | 内容 |
|---|---|
| Role ID | Crd |
| 役割原型 | 調整・進行・実装統括系 |
| 状態 | Active |
| 登録日 | 2026-07-11（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 状態変更履歴 | 2026-07-11 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | Coordinatorの略。正式文書での継続運用実績を根拠に遡及登録。 |

**Role ID：Ppl**

| 項目 | 内容 |
|---|---|
| Role ID | Ppl |
| 役割原型 | パイプライン実行・自動化・運用支援系 |
| 状態 | Active |
| 登録日 | 2026-07-11（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 状態変更履歴 | 2026-07-11 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | Pipelineの略。正式文書での継続運用実績を根拠に遡及登録。 |

**Role ID：Imp**

| 項目 | 内容 |
|---|---|
| Role ID | Imp |
| 役割原型 | 実装・技術運用支援系 |
| 状態 | Active |
| 登録日 | 2026-07-11（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 状態変更履歴 | 2026-07-11 初回登録（【ProC】Decision｜Ginより全プロジェクト担当者への文（Document Header Standard v1.4発効）） |
| 備考 | Implementerの略。正式運用実績を根拠として遡及登録。 |

### A-4 更新規則

本Registryの更新はGin裁定のみで実施可能とする。Role Registryの内容更新は本文規則の改訂とは独立して裁定できる。ただし、正本ファイルを更新した場合は、Registry更新履歴または文書版管理に変更を記録し、同一版の無履歴上書きを禁止する。

更新時は状態変更履歴への記録を必須とする。

履歴なき更新は無効とする。

正式運用実績のあるRole IDが未掲載であることを検出した場合、受信者はRole自体を無効化せず、Registry同期漏れ候補としてGinへNoticeまたはProposalで報告する。Gin裁定後、登録日および状態変更履歴を追記する。

Registry未掲載状態のまま使用された過去文書は、当該Role IDの運用実績またはGin裁定が確認できる限り有効とする。

現段階では状態変更履歴は各エントリ内に保持する。Role Registryを将来独立文書化する際は、必要に応じて共通変更ログを併設できる。


---

## 【Gin判断待ち — 隔離】

（新規なし — 本仕様書に関するGin裁定待ち項目はすべて解消）

解消済みの記録:
- v0.1判断待ち1〜3: 2026-07-07裁定で解消（発効承認・原文掲示・ProC提案へ移行）
- 大小文字規則: v1.1として統合済み
- ProC解釈: 2026-07-07 Gin「確定です」により解釈案1で確定、v1.2として統合済み。※裁定文に案番号の明示がなかったため、sos-Fableが推奨案（案1）での確定と解釈して統合した。案2の意図であった場合は本版を差し戻し、v1.3で修正する
- v1.4発効承認: 2026-07-11 Gin（【ProC】Decision｜Gin より Y3D-Crd への文（正本裁定））