import { describe, it, expect } from "vitest";
import { outOfModelRangeReason } from "@/src/lib/rules/calculate-risk";
import { findSubstance } from "@/src/lib/find-substance";
import type { Substance } from "@/src/types/domain";

// -----------------------------------------------------------------------------
// outOfModelRangeReason: スコア表示抑制の理由コード（構造化）の判定ゴールデン。
//
// 目的: 「なぜスコアを非表示にするか」を UI 層の生 dose 比較・生文字列に閉じず、
// ロジック層の構造化コード（ScoreSuppressionReason）で扱うことを固定する。
// 境界は doseStage（= getDoseMultiplier）と同一で、stage 3（veryHighMax 超）= 適用範囲外。
//
// methylphenidate: doseBands={commonMax:60, highMax:80, veryHighMax:120}
// -----------------------------------------------------------------------------
describe("outOfModelRangeReason（抑制理由コード）", () => {
  const mph = findSubstance("methylphenidate")!;

  it("veryHighMax 超は 'dose_out_of_model_range' を返す", () => {
    expect(outOfModelRangeReason(mph, 200)).toBe("dose_out_of_model_range");
  });

  it("veryHighMax ちょうど（境界）は範囲内で null", () => {
    // doseStage は dose <= veryHighMax を stage 2（範囲内）として扱う（境界は含む）。
    expect(outOfModelRangeReason(mph, 120)).toBeNull();
  });

  it("veryHighMax+1（境界の外側）は 'dose_out_of_model_range'（120→121 でフリップ）", () => {
    expect(outOfModelRangeReason(mph, 121)).toBe("dose_out_of_model_range");
  });

  it("commonMax 以下（通常量）は null", () => {
    expect(outOfModelRangeReason(mph, 30)).toBeNull();
  });

  it("highMax 帯（範囲内）も null", () => {
    expect(outOfModelRangeReason(mph, 70)).toBeNull();
  });

  it("doseBands 未定義の物質は範囲判定不能として null（抑制しない）", () => {
    const noBands: Substance = { id: "x", displayName: "x", category: "other", tags: [] };
    expect(outOfModelRangeReason(noBands, 1e9)).toBeNull();
  });
});
