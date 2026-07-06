import { describe, it, expect } from "vitest";
import {
  levelFor,
  SCORE_LEVEL_THRESHOLDS,
  SCORE_MIN,
  SCORE_MAX,
  scoreBands,
} from "@/src/lib/rules/score-level";

// levelFor の閾値ゴールデン（low/mid/high の一元判定）。
// この閾値は about ページ / README の説明と一致していること。
//   low : 0–33 / mid : 34–66 / high : 67–100
describe("levelFor — 閾値ゴールデン", () => {
  it("境界値ごとに期待レベルを返す", () => {
    const cases: [number, ReturnType<typeof levelFor>][] = [
      [-10, "low"], // clamp 済み前提だが下限外でも破綻しない
      [0, "low"],
      [33, "low"],
      [34, "mid"],
      [50, "mid"],
      [66, "mid"],
      [67, "high"],
      [100, "high"],
      [999, "high"], // 上限外でも high
    ];
    for (const [score, level] of cases) {
      expect(levelFor(score)).toBe(level);
    }
  });

  it("閾値定数が実装（境界の切り替わり）と一致している", () => {
    expect(levelFor(SCORE_LEVEL_THRESHOLDS.low)).toBe("low");
    expect(levelFor(SCORE_LEVEL_THRESHOLDS.low + 1)).toBe("mid");
    expect(levelFor(SCORE_LEVEL_THRESHOLDS.mid)).toBe("mid");
    expect(levelFor(SCORE_LEVEL_THRESHOLDS.mid + 1)).toBe("high");
  });
});

// scoreBands: 表示用バンド導出（/about の閾値表示を単一ソース化するための helper）。
describe("scoreBands — 表示用バンド導出", () => {
  it("SCORE_LEVEL_THRESHOLDS から 0–100 を隙間なく覆う3バンドを導出する", () => {
    expect(scoreBands()).toEqual([
      { level: "low", min: SCORE_MIN, max: SCORE_LEVEL_THRESHOLDS.low },
      { level: "mid", min: SCORE_LEVEL_THRESHOLDS.low + 1, max: SCORE_LEVEL_THRESHOLDS.mid },
      { level: "high", min: SCORE_LEVEL_THRESHOLDS.mid + 1, max: SCORE_MAX },
    ]);
  });

  it("各バンドの端点 level が levelFor と整合する", () => {
    for (const b of scoreBands()) {
      expect(levelFor(b.min)).toBe(b.level);
      expect(levelFor(b.max)).toBe(b.level);
    }
  });
});
