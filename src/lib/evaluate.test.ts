import { describe, it, expect } from "vitest";
import { evaluateRisk } from "@/src/lib/evaluate";
import type { RawRiskInput } from "@/src/lib/validation";

// 単一エントリ入力を組み立てるヘルパ。既存 substances のデータを前提にした実値を使う（スタブなし）。
function input(
  over: Partial<{
    entryKey: string;
    substanceId: string;
    dose: number;
    route: string;
  }> = {}
): RawRiskInput {
  return {
    entries: [
      {
        entryKey: "k1",
        substanceId: "methylphenidate", // routes: oral/rectal/nasal, veryHighMax: 120
        dose: 30,
        route: "oral",
        ...over,
      },
    ],
  };
}

describe("evaluateRisk 正常系", () => {
  it("有効入力なら ok:true かつ finalScore は number", () => {
    const res = evaluateRisk(input());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(typeof res.result.finalScore).toBe("number");
    }
  });
});

describe("evaluateRisk 異常系", () => {
  it("存在しない物質ID → substanceId エラー", () => {
    const res = evaluateRisk(input({ substanceId: "no_such_drug" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "substanceId" && e.entryKey === "k1")).toBe(true);
    }
  });

  it("その物質にない経路 → route エラー", () => {
    // moclobemide の routes は oral のみ。nasal は不許可。
    const res = evaluateRisk(input({ substanceId: "moclobemide", route: "nasal" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "route" && e.entryKey === "k1")).toBe(true);
    }
  });

  it.each([
    ["0", 0],
    ["負", -5],
    ["NaN", NaN],
    ["Infinity", Infinity],
  ])("dose が %s → dose エラー", (_label, dose) => {
    const res = evaluateRisk(input({ dose }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "dose" && e.entryKey === "k1")).toBe(true);
    }
  });

  it("dose が上限超 → dose エラー（veryHighMax=120 を導出して検証）", () => {
    const res = evaluateRisk(input({ dose: 200 }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "dose" && e.entryKey === "k1")).toBe(true);
    }
  });

  it("entries が空 → entries エラー", () => {
    const res = evaluateRisk({ entries: [] });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "entries")).toBe(true);
    }
  });
});
