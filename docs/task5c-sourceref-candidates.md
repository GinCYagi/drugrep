# Task5C-impl v3: SourceRef 候補一覧（references/ 由来）

> ステータス: **Phase2 実装済み**（6 PI を Adopted としてカタログ投入・`src()` 紐付け・golden 更新まで完了）
> 承認済み対応表（rule → SourceRef）は [task5c-source-catalog.md](./task5c-source-catalog.md) を正とする。
> 作成日: 2026-07-05 / Phase2 更新: 2026-07-06
> 生成: Claude Code（転記・候補生成）／ 採否・例外判断・最終承認: Gin
> 対象: `references/` に収集済みの一次資料 → MVP 物質の `SourceRef` 候補化
> 関連: [task5c-implementation-plan.md](./task5c-implementation-plan.md)、[task5c-source-guideline.md](./task5c-source-guideline.md)、[source-collection-rules.md](./source-collection-rules.md)

## 0. 方針（v3）と本ドキュメントの位置づけ

- **すべて候補。** ここに書いた `id` / `title` / `publisher` は AI 生成の書誌情報であり、**Gin 承認まで確定ではない**。
- **URL は創作・記憶補完しない（維持）。** ただし URL 未取得を理由に全件を Gin 転記へ戻さない。**URL 取得は別タスクに分離**（§5-2）。`sources.ts` 候補は `url: TODO` のままでよい。
- **`references/` のローカルパスは `sources.ts` に入れない。** 本ドキュメントの `evidence` 列はあくまで Gin が現物照合するための手掛かりで、`sources.ts` へは転記しない。
- **`src()` 紐付け・`interactionRules.sources` への投入は Gin 承認後。** 本作業ではコードを変更しない。
- **publisher は PDF 本文から抽出（v3 修正）**: `pdftotext` で各 PI/PDF の「26.1 製造販売元」/ TGA「Sponsor」欄を抽出し candidate に反映。抽出できたものは確定扱い（【PDF抽出】表記）、抽出できないものだけ `要Gin確認`。結果は §4-1。
- **doctype は固定語彙（`pmda-material` を含む16語）のみ**: SourceRef の doctype はこの語彙内に限定し、語彙外の語は作らない（`tga-*` / `artg-summary` 等は不使用）。海外当局（TGA）である事実は `publisher` と note で表現する。tramset の該当 PDF は既に `pmda-material_20110422.pdf` にリネーム済で doctype = `pmda-material`。

---

## 1. MVP 対象物質の正（task 1）

`src/lib/substances.ts` を正とし、README / `interaction-rules.ts` / golden と突き合わせて確認。**MVP 物質は 5 件**。

| # | id（正） | displayName | 代表販売名 | 相互作用ルール関与 | 備考 |
|---|---|---|---|---|---|
| 1 | `methylphenidate` | メチルフェニデート | リタリン / コンサータ | R4（stimulant） | alias に concerta/ritalin 双方 |
| 2 | `moclobemide` | モクロベミド | Aurorix（**日本未承認**） | R1（substance + serotonergic） | 国内資料なし・TGA が一次 |
| 3 | `pregabalin` | プレガバリン | リリカ | R2（depressant）/ R3（sedative_hypnotic） | |
| 4 | `tramadol_combo` | トラマドール/アセトアミノフェン | トラムセット | R1 / R2 / R3 / R4（ハブ） | **配合剤のみ**。単剤トラマドールは対象外 |
| 5 | `eszopiclone` | エスゾピクロン | ルネスタ | R2（depressant）/ R3（sedative_hypnotic） | |

- 照合結果: golden は `methylphenidate` / `tramadol_combo` / `moclobemide` を使用。`interaction-rules.ts` は `moclobemide`（substance）+ タグ参照のみ。**substances.ts の 5 件以外に MVP 物質は無い**。
- ルール ↔ 物質 ↔ タグの詳細対応は [task5c-source-candidate-list.md](./task5c-source-candidate-list.md)（収集計画）参照。

---

## 2. 収集済み資料との差異（task 2）

`references/` は **MVP スコープより広く**収集されている。差異は以下。

### 2-1. MVP 対象外（単剤トラマドール）— 候補化しない
substances.ts は単剤トラマドールを明示的に非対応（`tramadol_combo` と別実体）。以下は **収集済みだが MVP の SourceRef 候補にしない**（将来単剤を追加する時のストックとして保持）。

| フォルダ | 実体 | 判定 |
|---|---|---|
| `tramadol/onetram` | ワントラム（単剤徐放） | 対象外 |
| `tramadol/twotram` | ツートラム（単剤） | 対象外 |
| `tramadol/tramadol_od/*`（tramal_od, tramadol_od_KO） | トラマドールOD（単剤） | 対象外 |
| `tramadol/tramal_capsule`, `tramadol/tramal_injection` | トラマール（単剤） | 対象外 |

### 2-2. 代表選定（判断済）
- **配合剤の後発 21 社**: `tramadol-acetaminophen/toaraset_*`（トアラセット後発 20 社）+ その他。MVP `tramadol_combo` は**論理的に 1 実体**。→ **先発 `tramset`（トラムセット）を代表採用。後発 21 社は Post-MVP**（G3 判断済）。
- **メチルフェニデートの 2 製品**: `concerta`（OROS 徐放）と `ritalin`（速放）。→ **両方採用（剤形差のため統合しない）**（G4 判断済）。`concerta/` には IF が未収集だが欠落を許容。
- **pregabalin の lyrica フォルダ混在**: `lyrica/pi_20240319.pdf` のみ後発NPI で誤配置 → **lyrica として採用禁止・退避**（G10 判断済、§3-3-1）。

### 2-3. その他
- **`notes.md` がほぼ空**（`aurorix` のみ記入）。→ publisher/version/URL を notes から転記できず、**日付・版はファイル名からのみ**取得。
- **moclobemide は国内資料ゼロ**（notes.md 記載どおり）。TGA（豪）資料が一次。国内 PI/IF/PMDA は「Not available」で整合。

---

## 3. SourceRef 候補一覧（task 3・4）

各候補に **id / title / publisher / version・date / url / confidence / evidence** を付す。
凡例 — confidence: `date/version=ファイル名根拠(高)`, `title=doc種別+販売名の構成(中)`, `publisher=未転記(低)`。url は全件 TODO。
**evidence パスは `sources.ts` へ転記しない**（現物照合用）。

### 3-1. tramadol_combo（代表: 先発トラムセット / ハブ・最優先）

| フィールド | 候補1（PI） | 候補2（IF） | 候補3（PMDA資料） |
|---|---|---|---|
| id | `tramadol-acetaminophen_tramset_pi_20240823` | `tramadol-acetaminophen_tramset_if_202408_v12` | `tramadol-acetaminophen_tramset_pmda-material_20110422` |
| title | トラムセット配合錠 電子添文（2024-08-23）※AI構成 | トラムセット配合錠 インタビューフォーム 第12版（2024-08）※AI構成 | トラムセット配合錠に関する資料（2011-04-22）※Gin指定 |
| publisher | **ヤンセンファーマ株式会社**【PDF抽出: 26.1 製造販売元】 | ヤンセンファーマ株式会社【PIと同一】 | **ヤンセンファーマ株式会社**【PDFにて確認：Gin】 |
| version/date | 2024-08-23 | v12 / 2024-08 | 2011-04-22 |
| url | Gin 付与済み（sources.ts note 参照） | TODO（別タスク §4-3） | TODO（別タスク §4-3） |
| confidence | 高（publisher=PDF・date=ファイル名） | 高 | 中（publisher未抽出） |
| evidence | `.../tramset/pi_20240823.pdf` | `.../tramset/if_202408_v12.pdf` | `.../tramset/pmda-material_20110422.pdf` |

- doctype = `pmda-material`（固定語彙）。当該 PDF は画像でテキスト抽出不可のため title は Gin 指定「トラムセット配合錠に関する資料」を採用。
- 補助資料（必要時に候補化）: `review_20110422.pdf`（審査報告書, base/dose 根拠）, `reexam_20180927.pdf`, `safety_*` / `safety-case_*`。
- 想定ルール: R1（serotonergic）/ R2（depressant）/ R3（opioid_like）/ R4（seizure_threshold）。

### 3-2. moclobemide（TGA 豪・国内未承認）

| フィールド | 候補1（PI/TGA） | 候補2（CMI/TGA） |
|---|---|---|
| id | `moclobemide_aurorix_pi_20231007_v4.5` | `moclobemide_aurorix_cmi_20000322` | `moclobemide_aurorix_summary_19910208` |
| title | AURORIX® Product Information v4.5（2023-10-07） | Aurorix Consumer Medicine Information（2000-03-22）※AI構成 | Public Summary 9987 AURORIX moclobemide 150mg tablet（ARTG）※PDF抽出 |
| publisher | **Viatris Pty Ltd**【PDF抽出: SPONSOR】 | **Viatris Pty Ltd**【PDFにて確認：Gin】 | **Viatris Pty Ltd**【PDF抽出: Sponsor】 |
| version/date | v4.5 / 2023-10-07 | 2000-03-22 | ARTG Start 1991-08-02（**ファイル名 19910208 と不一致・要確認**） |
| url | Gin 付与済み（sources.ts note 参照・TGA） | TODO（別タスク §4-3） | TODO（別タスク §4-3・TGA） |
| confidence | 高（publisher=PDF） | 低（CMIは患者向け・二次寄り） | 中（publisher/種別=PDF, 日付要確認） |
| evidence | `.../aurorix/pi_20231007_v4.5.pdf` | `.../aurorix/cmi_20000322.pdf` | `.../aurorix/summary_19910208.pdf` |

- **G9 解決**: `summary_19910208.pdf` は **TGA ARTG Public Summary**（AusPAR ではない）。Sponsor = Viatris Pty Ltd。ただし本文の ARTG Start Date は 2/08/1991（豪表記=1991-08-02）で、ファイル名 `19910208` と月日が入れ替わっている疑い → 日付は要Gin確認。
- doctype は固定語彙（`pi` / `cmi` / `summary`）を使用。海外当局（TGA）である点は publisher（Viatris Pty Ltd）と note で表現し、id には regulator 接頭辞を付けない。
- 想定ルール: R1（substance = moclobemide の中核）。

### 3-3. pregabalin（リリカ）

| フィールド | 候補1（PI） | 候補2（IF） |
|---|---|---|
| フィールド | 候補1（PI・先発リリカ） | 候補2（IF・先発リリカ） |
|---|---|---|
| id | `pregabalin_lyrica_pi_20251201`（**Adopted**） | `pregabalin_lyrica_if_202512_v4`（Candidate） |
| title | リリカ 電子添文（カプセル・OD錠併記） | リリカ インタビューフォーム |
| publisher | **ヴィアトリス製薬合同会社**【PDF抽出: 26.1 製造販売元】 | ヴィアトリス製薬合同会社（先発リリカ） |
| version/date | 第8版 2025-12（販売開始 2010年6月＝先発） | v4 / 2025-12 |
| url | Gin 付与済み（sources.ts note 参照） | TODO（別タスク §4-3） |
| confidence | 高（実体=リリカ・publisher=PDF） | 中 |
| evidence | `references/pregabalin/lyrica/pi_20251201.pdf` | `references/pregabalin/lyrica/if_202512_v4.pdf` |

- ✅ **G10 解決（実体を PDF で確定）**: `lyrica/` は**先発リリカと後発NPIの混在**で、ズレているのは **`pi_20240319.pdf` の1ファイルのみ**。
  - `pi_20240319.pdf` の販売名 = **プレガバリンOD錠25mg/75mg/150mg「NPI」**（後発・製造販売＝日本薬品工業株式会社）。→ `lyrica/` から退避（§3-3-1）。
  - IF は「リリカカプセル/リリカOD錠」= **先発リリカで正しい**。`reexam_20190620` / `review_2010〜2013` / `safety_2012・2014` も先発リリカで正しい。
- 📌 **代表PIの範囲（Gin確認反映）**: 先発リリカは**カプセルと OD 錠が別 PI ではなく同一電子添文に併記**されている。したがって MVP は **先発リリカ電子添文（カプセル・OD 併記）1本を代表 PI として採用**する。
- ✅ **PI status: 解消（Phase2）** — 先発リリカ電子添文 `pi_20251201.pdf`（第8版・製造販売元＝**ヴィアトリス製薬合同会社**・販売開始 2010年6月＝先発）を配置・PDF 確認済。旧・後発NPI PI は `pregabalin-od_NPI/` へ退避済。
- ✅ **採用（判断反映）**: `pregabalin_lyrica_pi_20251201` を **Adopted**（sources.ts 投入・R2/R3 に `src()` 紐付け済）。後発NPI（OD錠）は対象外（Post-MVP、G3 の後発21社と同格）。
- 補助: `review_2010*/2012*`（審査, base/dose）, `reexam_20190620.pdf`, `safety_*`（いずれも先発リリカ）。想定ルール: R2 / R3。

#### 3-3-1. pregabalin 後発NPI の正しい product フォルダ名候補と移動案（G10）

**PDF 実体に基づく確定情報**（推測補完なし）:
- 販売名: プレガバリンOD錠25mg/75mg/150mg「NPI」
- 屋号（primary source に印字）: **「NPI」** ← PI 販売名に literal 記載
- 製造販売元: 日本薬品工業株式会社（問い合わせ先・社内資料より）。**英字社名は当該 PDF に記載なし**（`Co./Ltd/romaji` は抽出 0 件）→ 英字表記は推測しない。

**フォルダ名候補**（`source-collection-rules.md` の `ProductName_Manufacturer` 準拠）:
- 一般名フォルダ: `pregabalin`（変更なし）
- 製品フォルダ: **`pregabalin-od_NPI`**
  - ProductName = `pregabalin-od`（販売名「プレガバリンOD錠」）
  - Manufacturer token = `NPI`（PI 販売名の屋号「NPI」を literal 採用。toaraset_* と同じ屋号方式）
- 注: 会社レベルの英字表記（日本薬品工業の official English）を token に使いたい場合、当該 PDF には無いため **PMDA/IF から確認**（製造販売元の英字表記優先順: PMDA > IF > PI）。**推測での補完はしない**。

**移動（実行済み）**:
```
# 1) 新規フォルダ作成（済）
references/pregabalin/pregabalin-od_NPI/
# 2) 後発NPIのPIのみ退避（済・他ファイルは先発なので動かさない）
references/pregabalin/lyrica/pi_20240319.pdf → references/pregabalin/pregabalin-od_NPI/pi_20240319.pdf
# 3) 新フォルダに notes.md 作成（済・実体=後発NPI・製造販売元=日本薬品工業/屋号NPI を記録）
# 4) lyrica/notes.md に PI 欠落を記録（済）→ 先発リリカ電子添文の再収集は TODO（未）
```
- `if_202512_v7.pdf` / `reexam_*` / `review_*` / `safety_*` は **lyrica/ に残置**（先発リリカのため）。
- `references/` は gitignore 対象のため、この移動による git 追跡変更はなし。

### 3-4. eszopiclone（ルネスタ）

| フィールド | 候補1（PI） | 候補2（IF） |
|---|---|---|
| id | `eszopiclone_lunesta_pi_20241216` | `eszopiclone_lunesta_if_202412_v12` |
| title | ルネスタ 電子添文（2024-12-16）※AI構成 | ルネスタ インタビューフォーム 第12版（2024-12）※AI構成 |
| publisher | **エーザイ株式会社**【PDF抽出: 26.1 製造販売元】 | エーザイ株式会社【PIと同一】 |
| version/date | 2024-12-16 | v12 / 2024-12 |
| url | Gin 付与済み（sources.ts note 参照） | TODO（別タスク §4-3） |
| confidence | 高（publisher=PDF） | 高 |
| evidence | `references/eszopiclone/lunesta/pi_20241216.pdf` | `references/eszopiclone/lunesta/if_202412_v12.pdf` |

- 補助: `review_20120118.pdf`, `reexam_20210630.pdf`, `safety_20170321/20220720`。想定ルール: R2 / R3。

### 3-5. methylphenidate（concerta と ritalin を両方採用・G4 判断済）

| フィールド | 候補1（Concerta PI） | 候補2（Ritalin PI） | 候補3（Ritalin IF） |
|---|---|---|---|
| id | `methylphenidate_concerta_pi_20260624` | `methylphenidate_ritalin_pi_20260704` | `methylphenidate_ritalin_if_20260704` |
| title | コンサータ錠 電子添文（2026-06-24）※AI構成 | リタリン錠 電子添文（2026-07-04）※AI構成 | リタリン錠 インタビューフォーム（2026-07-04）※AI構成 |
| publisher | **ヤンセンファーマ株式会社**【PDF抽出: 26.1 製造販売元（輸入）】 | **ノバルティスファーマ株式会社**【PDF抽出: 26.1 製造販売元】 | ノバルティスファーマ株式会社【PIと同一】 |
| version/date | 2026-06-24 | 2026-07-04 | 2026-07-04（版表記なし） |
| url | Gin 付与済み（sources.ts note 参照） | Gin 付与済み（sources.ts note 参照） | TODO（別タスク §4-3） |
| confidence | 高（publisher=PDF） | 高（publisher=PDF） | 高 |
| evidence | `references/methylphenidate/concerta/pi_20260624.pdf` | `references/methylphenidate/ritalin/pi_20260704.pdf` | `references/methylphenidate/ritalin/if_20260704.pdf` |

- 補助: concerta `rmp_20260624.pdf` / `review_*` / `reexam_*` / `safety_*`；ritalin `safety_*`。想定ルール: R4（stimulant）。
- **G4 判断反映**: concerta（OROS 徐放）と ritalin（速放）は剤形差があるため**両方を別 id で採用**し統合しない。`concerta/` に IF は無いが、両剤採用のため ritalin IF と併存でよく、concerta IF は未収集のまま（欠落は許容）。

---

## 4. G1〜G9 の再分類（A / B / C）（task 1・v3）

- **A** = Claude Code だけで解消できる
- **B** = PDF 本文から機械抽出できる可能性がある（Claude が試行 → 抽出可なら確定、不可なら C へ降格）
- **C** = Gin の判断（採否・例外・設計）が必要

| # | 項目 | 分類 | 状態（今回の処理結果） |
|---|---|:---:|---|
| G1 | URL 全件 | **B→別タスク** | URL は創作しない方針を維持。取得は §4-3 の別タスクへ分離。`sources.ts` 候補は `url: TODO` のまま可 |
| G2 | publisher | **B（解決）** | PDF「26.1 製造販売元」/ TGA「Sponsor」から **6件中5件抽出済**（§4-1）。未抽出は pregabalin のみ（実体不一致のため C へ） |
| G3 | 配合剤の代表製品（先発 vs 後発21社） | **C（判断済）** | **先発 `tramset` を代表採用。後発21社は Post-MVP** |
| G4 | メチルフェニデート代表（concerta / ritalin） | **C（判断済）** | **concerta と ritalin を両方採用（剤形差のため統合しない）**。concerta は IF 未収集 |
| G5 | id 接頭辞 / doctype 語彙 | **A（解決）** | doctype は固定語彙（`pmda-material` 含む16語）のみ。regulator（TGA 等）は publisher/note で表現し、`tga-` 等の語彙外接頭辞は新設しない |
| G6 | 単剤トラマドール対象外 | **A（解決）** | substances.ts が単剤を明示非対応 → コードから確定。**対象外で確定**（Gin 判断不要） |
| G7 | title の正式名称 | **B（部分解決）** | Aurorix PI / ARTG Summary は PDF から実タイトル取得。国内 PI は「〇〇 電子添文」で機械構成可（正式名称の最終確認は軽微・§4-1 併記） |
| G8 | base/route/dose 係数の出典 | **C（判断済）** | **Post-MVP 送り**（`SourceRef` はルール単位・係数レベルは持てない。[guideline §4](./task5c-source-guideline.md)） |
| G9 | moclobemide summary の種別 | **B（解決）** | PDF 抽出で **TGA ARTG Public Summary** と確定（AusPAR ではない）。ただし日付要確認（§3-2） |
| G10 | pregabalin 実体不一致 | **C（解決済）** | 後発NPI PI を `pregabalin-od_NPI` へ退避＋先発リリカ PI（`pi_20251201.pdf`・ヴィアトリス製薬合同会社）を配置。`pregabalin_lyrica_pi_20251201` を Adopted |

### 4-1. publisher 自動抽出の結果（task 2）

`pdftotext` で各 PDF の製造販売元 / Sponsor 欄を抽出。**5/6 確定、1 は実体不一致で保留**。

| 物質 / 製品 | 抽出した publisher | 抽出元 | 判定 |
|---|---|---|---|
| tramadol_combo / トラムセット | ヤンセンファーマ株式会社 | PI「26.1 製造販売元」 | ✅ 確定 |
| eszopiclone / ルネスタ | エーザイ株式会社 | PI「26.1 製造販売元」 | ✅ 確定 |
| methylphenidate / コンサータ | ヤンセンファーマ株式会社 | PI「26.1 製造販売元（輸入）」 | ✅ 確定 |
| methylphenidate / リタリン | ノバルティスファーマ株式会社 | PI「26.1 製造販売元」 | ✅ 確定 |
| moclobemide / Aurorix | Viatris Pty Ltd | TGA PI / ARTG「Sponsor」 | ✅ 確定 |
| pregabalin / リリカ（先発） | ヴィアトリス製薬合同会社 | PI `pi_20251201.pdf`「26.1 製造販売元」 | ✅ 確定（Phase2 収集後） |

### 4-2. Gin 判断の状況（すべて判断済）

C 分類（G3/G4/G8/G10）は本ラウンドで判断確定:

1. **G3** → 先発 `tramset` 採用、後発21社 Post-MVP ✅
2. **G4** → concerta と ritalin を**両方採用**（統合しない）✅
3. **G8** → Post-MVP 送り ✅
4. **G10** → lyrica として採用禁止。後発NPIは `pregabalin-od_NPI` へ退避 ✅

**残る作業（判断ではなく実施項目）**:
- （a）**G10 のファイル移動** — ✅ 完了（後発NPI を `pregabalin-od_NPI/` へ退避）。
- （b）**先発リリカ電子添文（PI）配置** — ✅ 完了（`pi_20251201.pdf` 配置・Adopted）。
- （c）**URL 取得**（§4-3 の別タスク）— 未（Adopted 6 件の URL 付与）。

> URL（G1）と publisher は Gin の「転記」作業にしない。URL は §4-3 の自動取得タスク、publisher は PDF 抽出で解消済（先発リリカ PI のみ再収集後）。

### 4-3. URL 取得（別タスクに分離・task 3）

> ✅ **実施済み（Phase2 後）**: Gin が Adopted 6 件の URL を付与（`sources.ts` の各 note 末尾に PMDA/TGA URL を記載。`SourceRef.url` フィールドは未設定のまま）。以下は当時の計画記述（歴史的記録として保持）。候補（未 Adopt）の IF/CMI/summary/material は引き続き未取得。

- **URL は創作・記憶補完しない**方針は維持。ただし URL 未取得を理由に全件 Gin 転記へ戻さない。
- 別タスクとして、承認された候補について **PMDA/TGA の公開ページを検索・照合して実 URL を取得**する（Claude が候補 URL を提示 → Gin が現物一致を最終確認、または自動照合）。
- それまで `sources.ts` 候補は `url: TODO` のままでよく、`src()` 紐付けや `assertRuleSources`（非空検証）は URL 有無に依存しない。

---

## 5. aggregateSources / assertRuleSources との非競合（task 6）

本作業は **docs のみ**で、実装済み機構と競合しない。承認後の接続経路は以下（今回は未実施）。

- **今回の変更**: `interactionRules`・`SourceRef` 型・`calculate-risk.ts`・`app/about` いずれも未変更。`src()` 紐付けなし。
- **承認後の流れ（将来）**:
  1. Gin が候補を承認 → `sources.ts`（正典データ）に `{id,title,url,note}` を登録（**evidence のローカルパスは入れない**）。
  2. ルールへ `src("id")` で参照 → `evaluateInteractions` が `rule.sources` を連結。
  3. `aggregateSources` が **id で重複除去**（本候補の id は文書単位で一意に設計済み＝dedup 親和的。先発/後発や concerta/ritalin を別 id にしている理由もこれ）。
  4. `assertRuleSources` が severity 別に **非空を検証**（現状は全ルール空を許容、実行時 throw なし）。
- **競合しない設計上の担保**: id は文書単位ユニーク（固定語彙の doctype `pi-`/`if-`/`pmda-material-` 等 + 一般名 + 製品）。同一出典を複数ルールが参照しても `aggregateSources` が畳むため、`/about` 出典一覧で重複しない。

---

## 6. test / tsc / build（task 7）

本作業は docs 追加のみでコード非変更のため、回帰確認として実行（結果は本ドキュメント末尾の報告メッセージ参照）。`interactionRules` / golden / `SourceRef` 型は不変。

---

## 7. まとめ

- MVP 物質は substances.ts の **5 件**で確定。`references/` はそれより広く（単剤トラマドール・後発 21 社）収集済み → **対象外/代表選定**を §2・§4 に分離。
- **publisher は PDF から抽出（v3 修正）**: 6件中5件を製造販売元/Sponsor 欄から確定。残 1（pregabalin）は実体が後発 OD 錠で不一致（G10）。**URL は全件 TODO のまま**だが、これは別タスク（§4-3）に分離し、Gin 転記へは戻さない。
- **doctype は固定語彙（`pmda-material` を含む16語）のみ**: tramset の該当 PDF は `pmda-material_20110422.pdf`。語彙外の doctype（`tga-*` / `artg-summary` 等）は使わず、regulator は publisher/note で表現。
- Gin が判断すべきは **C 分類の 4 項目のみ**（§4-2）。publisher/URL の機械作業と doctype 語彙・単剤対象外は Gin の手を離す。
- `src()` 紐付け・`sources.ts` 投入・`interactionRules` 変更は **Gin 承認後**。実装済み `aggregateSources`/`assertRuleSources` とは非競合。
