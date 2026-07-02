import { calculateRisk } from "@/src/lib/rules/calculate-risk";
import type { RiskResult } from "@/src/types/domain";
import {
  RiskInputSchema,
  toFieldErrors,
  type FieldError,
  type RawRiskInput,
} from "@/src/lib/validation";

// 検証済み入力のみを純粋関数 calculateRisk に渡すためのオーケストレーション層。
// Zod 依存はここと validation.ts に閉じ、src/lib/rules/ からは import しない。
export type EvaluateResult =
  | { ok: true; result: RiskResult }
  | { ok: false; errors: FieldError[] };

// エントリ単位評価。UI はカード単位で entries 1件を渡して呼ぶ。
// safeParse が成功したときだけ calculateRisk を呼び、throw しない。
// クロス相互作用の集計は calculateCombinedRisk の責務であり、本関数は関与しない。
export function evaluateRisk(raw: RawRiskInput): EvaluateResult {
  const parsed = RiskInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error, raw) };
  }

  const entry = parsed.data.entries[0];
  const result = calculateRisk(entry.substanceId, String(entry.dose), entry.route);
  return { ok: true, result };
}
