import { InteractionRule } from "@/src/types/domain";
import { src } from "@/src/lib/rules/source-catalog";

// interactionRules はアプリ内部の相対評価ルール（暫定値 / 要レビュー）。
// 医療的勧告ではなく、calculateCombinedRisk の加算寄与を決めるための内部スケール。
//
// 重複 substance の扱い:
//   同一 substance.id を複数エントリ入力した場合、相互作用評価では「1 種類」として数える
//   （量的過量は doseBands 側で評価する責務分離）。
//   requires の substance match / tag minCount の両方に dedupe 後の集合を適用する。
export const interactionRules: InteractionRule[] = [
  {
    id: "maoi_plus_serotonergic",
    label: "MAOI × セロトニン作動薬",
    description:
      "RIMA（モクロベミド）とセロトニン作動性物質の併用はセロトニン症候群リスク。",
    severity: "high",
    requires: [
      { kind: "substance", id: "moclobemide" },
      { kind: "tag", tag: "serotonergic", minCount: 2 },
    ],
    effect: { kind: "add", value: 10 },
    // Task5C: 承認済み PI（MAOI 側 + セロトニン作動側）。medical ロジックは不変。
    sources: [
      src("moclobemide_aurorix_pi_20231007_v4.5"),
      src("tramadol-acetaminophen_tramset_pi_20240823"),
    ],
  },
  {
    id: "depressant_stacking",
    label: "中枢抑制系の重複使用",
    description:
      "抑制作用を持つ物質が2種類以上。過鎮静・呼吸抑制リスクが上昇する可能性。",
    severity: "caution",
    requires: [{ kind: "tag", tag: "depressant", minCount: 2 }],
    effect: { kind: "add", value: 6 },
    // Task5C: 中枢抑制作用を持つ承認済み PI（プレガバリン・トラムセット・エスゾピクロン）。
    sources: [
      src("pregabalin_lyrica_pi_20251201"),
      src("tramadol-acetaminophen_tramset_pi_20240823"),
      src("eszopiclone_lunesta_pi_20241216"),
    ],
  },
  {
    id: "opioid_plus_sedative_hypnotic",
    label: "オピオイド様 × 睡眠薬様",
    description:
      "オピオイド様作用と睡眠薬様作用の併用は呼吸抑制の相乗リスク。",
    severity: "high",
    requires: [
      { kind: "tag", tag: "opioid_like", minCount: 1 },
      { kind: "tag", tag: "sedative_hypnotic", minCount: 1 },
    ],
    effect: { kind: "add", value: 8 },
    // Task5C: オピオイド様（トラムセット）× 睡眠薬様（エスゾピクロン・プレガバリン）の承認済み PI。
    sources: [
      src("tramadol-acetaminophen_tramset_pi_20240823"),
      src("eszopiclone_lunesta_pi_20241216"),
      src("pregabalin_lyrica_pi_20251201"),
    ],
  },
  {
    id: "seizure_threshold_with_stimulant",
    label: "けいれん閾値低下物質 × 刺激系",
    description:
      "けいれん閾値を下げる物質と中枢刺激作用の併用はけいれん誘発リスク。",
    severity: "caution",
    requires: [
      { kind: "tag", tag: "seizure_threshold_lowering", minCount: 1 },
      { kind: "tag", tag: "stimulant", minCount: 1 },
    ],
    effect: { kind: "add", value: 4 },
    // Task5C: けいれん閾値低下（トラムセット）× 刺激系（メチルフェニデート concerta/ritalin）の承認済み PI。
    sources: [
      src("tramadol-acetaminophen_tramset_pi_20240823"),
      src("methylphenidate_concerta_pi_20260624"),
      src("methylphenidate_ritalin_pi_20260704"),
    ],
  },
];
