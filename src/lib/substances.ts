import { Substance } from "@/src/types/domain";

// doseBands はアプリ内部の相対評価閾値（暫定値 / 要レビュー）。
// 医療的推奨用量や添付文書の上限値ではなく、calculateRisk の用量補正係数を
// 決めるための内部スケールとして扱うこと。
// aliases は商品名・略号・カタカナ表記のみ（スペルミス吸収は含めない）。
export const substances: Substance[] = [
  {
    id: "methylphenidate",
    displayName: "メチルフェニデート",
    genericName: "Methylphenidate",
    category: "prescription",
    defaultUnit: "mg",
    routes: ["oral", "rectal", "nasal"],
    halfLifeHours: { min: 3, max: 4 },
    aliases: ["リタリン", "ritalin", "コンサータ", "concerta", "mph"],
    doseBands: { commonMax: 60, highMax: 80, veryHighMax: 120 },
    tags: [
      { tag: "stimulant", weight: 3 },
      { tag: "heart_rate_up", weight: 2 },
      { tag: "blood_pressure_up", weight: 2 },
      { tag: "arrhythmia_risk", weight: 1 },
    ],
  },
  {
    id: "moclobemide",
    displayName: "モクロベミド",
    genericName: "Moclobemide",
    category: "prescription",
    defaultUnit: "mg",
    routes: ["oral"],
    halfLifeHours: { min: 2, max: 4 },
    aliases: ["aurorix", "manerix"],
    doseBands: { commonMax: 600, highMax: 900, veryHighMax: 1200 },
    tags: [{ tag: "serotonergic", weight: 2 }],
  },
  {
    id: "pregabalin",
    displayName: "プレガバリン",
    genericName: "Pregabalin",
    category: "prescription",
    defaultUnit: "mg",
    routes: ["oral"],
    halfLifeHours: { min: 5, max: 7 },
    aliases: ["リリカ", "lyrica", "プレガバ"],
    doseBands: { commonMax: 600, highMax: 900, veryHighMax: 1200 },
    tags: [
      { tag: "depressant", weight: 2 },
      { tag: "sedative_hypnotic", weight: 2 },
    ],
  },
  {
    id: "tramadol_combo",
    displayName: "トラマドール/アセトアミノフェン",
    genericName: "Tramadol combo",
    category: "prescription",
    defaultUnit: "tablet",
    routes: ["oral"],
    halfLifeHours: { min: 5, max: 7 },
    // 単剤トラマドール（"トラマドール" / "tramadol"）は配合剤とは別実体のため、
    // alias として含めない。単剤は現時点では未対応。
    aliases: ["トラムセット", "tramcet"],
    doseBands: { commonMax: 8, highMax: 12, veryHighMax: 16 },
    tags: [
      { tag: "opioid_like", weight: 2 },
      { tag: "respiratory_depression", weight: 1 },
      { tag: "serotonergic", weight: 1 },
      { tag: "seizure_threshold_lowering", weight: 2 },
      { tag: "depressant", weight: 1 },
    ],
  },
  {
    id: "eszopiclone",
    displayName: "エスゾピクロン",
    genericName: "Eszopiclone",
    category: "prescription",
    defaultUnit: "mg",
    routes: ["oral"],
    halfLifeHours: { min: 5, max: 6 },
    aliases: ["ルネスタ", "lunesta", "エスゾピ"],
    doseBands: { commonMax: 3, highMax: 6, veryHighMax: 9 },
    tags: [
      { tag: "depressant", weight: 2 },
      { tag: "sedative_hypnotic", weight: 3 },
      { tag: "respiratory_depression", weight: 1 },
    ],
  },
];
