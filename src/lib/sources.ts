import type { SourceRef } from "@/src/types/domain";

// SourceRef 正典カタログ（Task5C Phase2 で採用 = Adopted）。
//
// 方針:
// - データ専用。ロジックは混入しない（substances.ts と同じ扱い）。参照解決は src()（rules 層）。
// - 各エントリは Gin 承認済みの MVP 代表 PI（一次資料）。
// - ID 命名規則: <substance>_<product>_<doctype>_<date>[_<version>][_<seq>]
//   （doctype は固定語彙。date/version は candidates またはファイル名に基づき、推測補完しない）
// - `note` は PDF 本文から抽出した製造販売元 + 版/改訂日（推測補完なし）。海外当局（TGA）である
//   事実も note で表現する。
// - `url` は未取得のため意図的に省略し、note に "URL pending; requires Gin verification" を明記。
//   URL は創作・記憶補完しない（別タスクで Gin 照合後に付与）。
// - `references/` のローカルパスは持たない（現物照合は docs 側の evidence 列で行う）。
export const sourceCatalog: Record<string, SourceRef> = {
  "tramadol-acetaminophen_tramset_pi_20240823": {
    id: "tramadol-acetaminophen_tramset_pi_20240823",
    title: "トラムセット配合錠 電子添文",
    note: "ヤンセンファーマ株式会社 / 2024-08-23 / https://www.pmda.go.jp/PmdaSearch/rdDetail/iyaku/1149117F1020_1?user=1",
  },
  "moclobemide_aurorix_pi_20231007_v4.5": {
    id: "moclobemide_aurorix_pi_20231007_v4.5",
    title: "AURORIX® Product Information",
    note: "Viatris Pty Ltd (TGA Australia) / v4.5 2023-10-07 / https://www.tga.gov.au/resources/artg/9987",
  },
  "pregabalin_lyrica_pi_20251201": {
    id: "pregabalin_lyrica_pi_20251201",
    title: "リリカ 電子添文（カプセル・OD錠併記）",
    note: "ヴィアトリス製薬合同会社 / 第8版 2025-12-01 / https://www.pmda.go.jp/PmdaSearch/rdDetail/iyaku/1190017F1029_3?user=1",
  },
  "eszopiclone_lunesta_pi_20241216": {
    id: "eszopiclone_lunesta_pi_20241216",
    title: "ルネスタ 電子添文",
    note: "エーザイ株式会社 / 2024-12-16 / https://www.pmda.go.jp/PmdaSearch/rdDetail/iyaku/1129010F1028_1?user=1",
  },
  "methylphenidate_concerta_pi_20260624": {
    id: "methylphenidate_concerta_pi_20260624",
    title: "コンサータ錠 電子添文",
    note: "ヤンセンファーマ株式会社 / 2026-06-24 / https://www.pmda.go.jp/PmdaSearch/rdDetail/iyaku/1179009G1022_1",
  },
  "methylphenidate_ritalin_pi_20260704": {
    id: "methylphenidate_ritalin_pi_20260704",
    title: "リタリン錠 電子添文",
    note: "ノバルティスファーマ株式会社 / 2026-07-04 / https://www.pmda.go.jp/PmdaSearch/rdDetail/iyaku/1179009F1035_1?user=1",
  },
};
