// calculateCombinedRisk のロジック検証用スクリプト。
// UI 未着手のため、interactionRules の発火条件・dedupe 挙動・合成計算を
// コード経由で確認する目的の一時ハーネス。検証後に残す/削除は別判断。
//
// 実行方法: npx tsx scripts/verify-interactions.mts
// （tsx は tsconfig の paths alias を解決するため @/src/... が使える）

import { calculateCombinedRisk } from "../src/lib/rules/calculate-risk";
import type { DoseInput } from "../src/types/domain";

type Case = {
  name: string;
  entries: DoseInput[];
  expectedRuleIds: string[]; // 集合として比較（順序非依存）
};

const cases: Case[] = [
  {
    name: "1. moclobemide 単独 → Rule 1 非発火",
    entries: [{ drug: "moclobemide", dose: "300", route: "oral" }],
    expectedRuleIds: [],
  },
  {
    name: "2. moclobemide + tramadol_combo → Rule 1 発火",
    entries: [
      { drug: "moclobemide", dose: "300", route: "oral" },
      { drug: "tramadol_combo", dose: "2", route: "oral" },
    ],
    expectedRuleIds: ["maoi_plus_serotonergic"],
  },
  {
    name: "3. pregabalin + eszopiclone → depressant_stacking 発火",
    entries: [
      { drug: "pregabalin", dose: "150", route: "oral" },
      { drug: "eszopiclone", dose: "2", route: "oral" },
    ],
    expectedRuleIds: ["depressant_stacking"],
  },
  {
    name: "4. tramadol_combo + eszopiclone → depressant_stacking + opioid_plus_sedative_hypnotic",
    entries: [
      { drug: "tramadol_combo", dose: "2", route: "oral" },
      { drug: "eszopiclone", dose: "2", route: "oral" },
    ],
    expectedRuleIds: ["depressant_stacking", "opioid_plus_sedative_hypnotic"],
  },
  {
    name: "5. tramadol_combo + methylphenidate → seizure_threshold_with_stimulant",
    entries: [
      { drug: "tramadol_combo", dose: "2", route: "oral" },
      { drug: "methylphenidate", dose: "60", route: "oral" },
    ],
    expectedRuleIds: ["seizure_threshold_with_stimulant"],
  },
  {
    name: "6. pregabalin + pregabalin + eszopiclone → depressant_stacking 1回のみ（重複加算なし）",
    entries: [
      { drug: "pregabalin", dose: "150", route: "oral" },
      { drug: "pregabalin", dose: "150", route: "oral" },
      { drug: "eszopiclone", dose: "2", route: "oral" },
    ],
    expectedRuleIds: ["depressant_stacking"],
  },
];

function setEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

let pass = 0;
let fail = 0;

for (const c of cases) {
  const result = calculateCombinedRisk(c.entries);
  const gotIds = result.triggered.map((t) => t.ruleId);
  const idsOk = setEqual(gotIds, c.expectedRuleIds);
  const noDup = gotIds.length === new Set(gotIds).size;
  const ok = idsOk && noDup;

  console.log(`[${ok ? "PASS" : "FAIL"}] ${c.name}`);
  console.log(`       triggered: ${JSON.stringify(gotIds)}`);
  console.log(`       expected : ${JSON.stringify(c.expectedRuleIds)}`);
  console.log(
    `       soloTotal=${result.soloTotal.toFixed(2)}  interactionAdd=${result.interactionAdd}  finalScore=${result.finalScore}`
  );
  if (!noDup) console.log(`       ⚠ 同一 ruleId が複数回 triggered（重複加算の疑い）`);
  console.log();

  if (ok) pass++;
  else fail++;
}

console.log("---");
console.log(`Total: ${pass + fail}  PASS: ${pass}  FAIL: ${fail}`);
if (fail > 0) process.exit(1);
