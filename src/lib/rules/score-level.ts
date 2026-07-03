import type { ScoreLevel } from "@/src/types/domain";

// finalScore → レベル区分（low/mid/high）の一元化。
// 閾値はここ一箇所に集約し、UI（ScorePanel）・RiskResult.level の両方から参照する。
//   low : 0–33
//   mid : 34–66
//   high: 67–100
// finalScore は clamp 済み（0–100 の整数）を前提とするが、範囲外の値でも
// 破綻しないよう <= 比較で全域をカバーする。
export const SCORE_LEVEL_THRESHOLDS = {
  // このバンド上限（含む）までが該当レベル。high はそれ以上すべて。
  low: 33,
  mid: 66,
} as const;

export function levelFor(finalScore: number): ScoreLevel {
  if (finalScore <= SCORE_LEVEL_THRESHOLDS.low) return "low";
  if (finalScore <= SCORE_LEVEL_THRESHOLDS.mid) return "mid";
  return "high";
}
