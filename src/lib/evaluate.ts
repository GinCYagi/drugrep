import {
  calculateRisk,
  calculateCombinedRisk,
} from "@/src/lib/rules/calculate-risk";
import type { RiskResult, RiskTag } from "@/src/types/domain";
import {
  RiskInputSchema,
  toFieldErrors,
  type FieldError,
  type RawRiskInput,
} from "@/src/lib/validation";

// 検証済み入力のみを純粋関数 calculateRisk / calculateCombinedRisk に渡す
// オーケストレーション層。Zod 依存はここと validation.ts に閉じ、
// src/lib/rules/ からは import しない。
export type EvaluateResult =
  | { ok: true; result: RiskResult }
  | { ok: false; errors: FieldError[] };

// 入力を評価し、RiskResult（単剤詳細 or 複数薬集計）を返す。
// safeParse が成功したときだけ評価関数を呼び、throw しない。
export function evaluateRisk(raw: RawRiskInput): EvaluateResult {
  const parsed = RiskInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error, raw) };
  }

  const entries = parsed.data.entries;

  // 単剤: 既存の詳細 breakdown（base × routeFactor × doseFactor）を保持するため
  // calculateRisk をそのまま使う（UI のカード内訳表示・既存挙動を変えない）。
  if (entries.length === 1) {
    const e = entries[0];
    const result = calculateRisk(e.substanceId, String(e.dose), e.route);
    return { ok: true, result };
  }

  // 複数薬: 相互作用込みの集計は既存の calculateCombinedRisk に委譲し、
  // その結果を RiskResult 形状にアダプトする（新しい評価ロジックは足さない）。
  // - finalScore / interactionAdd / firedInteractions / sources は集計結果から
  // - tags / warnings は各エントリの calculateRisk（既存ロジック）の和集合・連結から
  const doseInputs = entries.map((e) => ({
    drug: e.substanceId,
    dose: String(e.dose),
    route: e.route,
  }));
  const combined = calculateCombinedRisk(doseInputs);
  const perEntry = entries.map((e) =>
    calculateRisk(e.substanceId, String(e.dose), e.route)
  );

  const tagSet = new Set<RiskTag>();
  for (const r of perEntry) for (const t of r.tags) tagSet.add(t);

  const result: RiskResult = {
    finalScore: combined.finalScore,
    // 集計 breakdown: solo 合算を base に置き、route/dose 係数は各エントリ側で
    // 消化済みのため 1。interactionAdd のみ相互作用加算を表す。
    // これにより finalScore = round(base × route × dose + interactionAdd) の関係を維持。
    breakdown: {
      base: combined.soloTotal,
      routeFactor: 1,
      doseFactor: 1,
      interactionAdd: combined.interactionAdd,
    },
    firedInteractions: combined.triggered,
    warnings: perEntry.flatMap((r) => r.warnings),
    tags: [...tagSet],
    sources: combined.sources,
  };
  return { ok: true, result };
}
