# Source Catalog（承認済み対応表・Task5C Phase2）

> 実体: `src/lib/sources.ts`（正典カタログ）＋ `src/lib/rules/interaction-rules.ts` の `src()` 紐付け。
> 本表はその Adopted 状態を人が読む形で写したもの。
> ID 命名規則 v0.4: `<substance>_<product>_<doctype>_<date>[_<version>][_<seq>]`（doctype は固定語彙。date/version はファイル名/candidates 由来・推測補完なし）。
> URL は **Gin により付与済み**（`sources.ts` の各 note に PMDA/TGA の URL を記載）。`SourceRef.url` フィールドは未設定のまま（URL は現状 note 内）。`references/` のローカルパスはカタログに入れない。

## 1. Adopted カタログ（sources.ts 投入済み・6 件）

| ID | Drug | doctype | Title | Publisher（PDF抽出） | Version/Date | URL | Status |
|----|------|---------|-------|----------------------|--------------|-----|--------|
| `tramadol-acetaminophen_tramset_pi_20240823` | tramadol_combo | pi | トラムセット配合錠 電子添文 | ヤンセンファーマ株式会社 | 2024-08-23 | note内※ | Adopted |
| `moclobemide_aurorix_pi_20231007_v4.5` | moclobemide | pi | AURORIX® Product Information | Viatris Pty Ltd (TGA Australia) | v4.5 / 2023-10-07 | note内※ | Adopted |
| `pregabalin_lyrica_pi_20251201` | pregabalin | pi | リリカ 電子添文（カプセル・OD錠併記） | ヴィアトリス製薬合同会社 | 第8版 / 2025-12 | note内※ | Adopted |
| `eszopiclone_lunesta_pi_20241216` | eszopiclone | pi | ルネスタ 電子添文 | エーザイ株式会社 | 2024-12-16 | note内※ | Adopted |
| `methylphenidate_concerta_pi_20260624` | methylphenidate | pi | コンサータ錠 電子添文 | ヤンセンファーマ株式会社 | 2026-06-24 | note内※ | Adopted |
| `methylphenidate_ritalin_pi_20260704` | methylphenidate | pi | リタリン錠 電子添文 | ノバルティスファーマ株式会社 | 2026-07-04 | note内※ | Adopted |

- Publisher は各 PI 本文「26.1 製造販売元」/ TGA「Sponsor」から抽出（推測補完なし）。
- ※ **URL は Gin が付与済み**（`sources.ts` の各 note 末尾に PMDA/TGA URL を記載）。`SourceRef.url` フィールドは未設定のまま（URL は現状 note 内）。SourceRef 型は `{id,title,url?,note?}` のまま（未変更）。version/date/publisher/URL は `note` に格納。

## 2. Rule → SourceRef 対応表（interaction-rules.ts の `src()` 紐付け）

| Rule ID | severity | 紐付けた SourceRef | 件数 |
|---------|----------|--------------------|------|
| `maoi_plus_serotonergic` | high | `moclobemide_aurorix_pi_20231007_v4.5`, `tramadol-acetaminophen_tramset_pi_20240823` | 2 |
| `depressant_stacking` | caution | `pregabalin_lyrica_pi_20251201`, `tramadol-acetaminophen_tramset_pi_20240823`, `eszopiclone_lunesta_pi_20241216` | 3 |
| `opioid_plus_sedative_hypnotic` | high | `tramadol-acetaminophen_tramset_pi_20240823`, `eszopiclone_lunesta_pi_20241216`, `pregabalin_lyrica_pi_20251201` | 3 |
| `seizure_threshold_with_stimulant` | caution | `tramadol-acetaminophen_tramset_pi_20240823`, `methylphenidate_concerta_pi_20260624`, `methylphenidate_ritalin_pi_20260704` | 3 |

- 紐付けは各ルールの発火条件（requires のタグ／物質）に対応する MVP 代表 PI。医学ロジック（requires/effect/severity/description）は不変。
- high 系（R1/R3）は 2 件以上（ガイドライン §4 推奨を満たす）。`assertRuleSources` は全ルール非空を通過（テストで実証）。

## 3. Post-MVP / 未採用

| 対象 | 理由 |
|------|------|
| 配合剤 後発 21 社（`toaraset_*` 等） | 先発 tramset を代表採用（G3） |
| `pregabalin-od_NPI`（後発 OD 錠「NPI」） | 先発リリカを代表採用（G10）。`pregabalin-od_NPI/` に退避済 |
| 単剤トラマドール（onetram/twotram/tramal/tramadol_od） | substances.ts が単剤非対応（G6） |
| moclobemide `cmi` / `summary`、tramset `pmda-material`、各 IF | 候補（Candidate）。MVP のルール引用は PI で充足のため未 Adopt |
| base/route/dose 係数の出典 | Post-MVP（SourceRef はルール単位・係数レベルは持てない、G8） |

## 4. 残タスク

- **URL 取得**: ✅ Gin により付与済み（Adopted 6 件の PMDA/TGA URL を `sources.ts` の note に記載）。
- （任意）URL を `note` から `SourceRef.url` フィールドへ移す整理（型変更不要）。現状は note 内で足りるため保留可。
