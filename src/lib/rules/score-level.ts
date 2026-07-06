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

// スコア表示の下限・上限（両端含む）。levelFor は範囲外でも破綻しないが、
// バンド表示の端点として 0–100 をここで単一ソース化する。
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

// 表示用: 各レベルのスコア範囲（min–max, 両端含む）を SCORE_LEVEL_THRESHOLDS から導出。
// UI（/about のバンド説明など）が閾値をハードコードせず、ここから導出するための helper。
// levelFor と同じ閾値を用いるため、閾値を変えれば表示も自動追従する。
export type ScoreBand = { level: ScoreLevel; min: number; max: number };

export function scoreBands(): ScoreBand[] {
  return [
    { level: "low", min: SCORE_MIN, max: SCORE_LEVEL_THRESHOLDS.low },
    { level: "mid", min: SCORE_LEVEL_THRESHOLDS.low + 1, max: SCORE_LEVEL_THRESHOLDS.mid },
    { level: "high", min: SCORE_LEVEL_THRESHOLDS.mid + 1, max: SCORE_MAX },
  ];
}
