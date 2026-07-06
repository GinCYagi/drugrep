import { describe, it, expect } from "vitest";
import {
  assertRuleSources,
  getRuleSourceGaps,
} from "@/src/lib/rules/assert-rule-sources";
import { interactionRules } from "@/src/lib/rules/interaction-rules";
import type { InteractionRule, SourceRef } from "@/src/types/domain";

const SRC: SourceRef = { id: "pi-x", title: "X 電子添文" };

// テスト専用フィクスチャ（interactionRules 本体は変更しない）。
function rule(over: Partial<InteractionRule>): InteractionRule {
  return {
    id: "fixture",
    label: "fixture",
    severity: "high",
    requires: [{ kind: "tag", tag: "depressant" }],
    effect: { kind: "add", value: 1 },
    ...over,
  };
}

describe("getRuleSourceGaps", () => {
  it("sources を満たすルールは gap に含まれない", () => {
    const gaps = getRuleSourceGaps([rule({ sources: [SRC] })]);
    expect(gaps).toEqual([]);
  });

  it("sources 未定義（キーなし）は 0 件として gap 検出される", () => {
    const gaps = getRuleSourceGaps([rule({ id: "no-key" })]);
    expect(gaps).toEqual([
      { ruleId: "no-key", severity: "high", have: 0, need: 1 },
    ]);
  });

  it("空配列 sources も 0 件として gap 検出される", () => {
    const gaps = getRuleSourceGaps([rule({ id: "empty", sources: [] })]);
    expect(gaps).toEqual([
      { ruleId: "empty", severity: "high", have: 0, need: 1 },
    ]);
  });

  it("severity 別のしきい値上書きで high を 2 件必須にできる", () => {
    const gaps = getRuleSourceGaps([rule({ sources: [SRC] })], {
      critical: 1,
      high: 2,
      caution: 1,
    });
    expect(gaps).toEqual([
      { ruleId: "fixture", severity: "high", have: 1, need: 2 },
    ]);
  });
});

describe("assertRuleSources", () => {
  it("全ルールが要件を満たせば throw しない", () => {
    expect(() =>
      assertRuleSources([rule({ sources: [SRC] })])
    ).not.toThrow();
  });

  it("出典未整備のルールがあると throw する（意図的失敗ケースの実証）", () => {
    expect(() => assertRuleSources([rule({ sources: [] })])).toThrow(
      /出典が不足/
    );
  });
});

// -----------------------------------------------------------------------------
// Task5C Phase2: 全 interactionRule に承認済み PI を紐付け済み。
// ここで assertRuleSources の実効性を実証する（全ルール非空を満たす）。
// -----------------------------------------------------------------------------
describe("interactionRules（Phase2: 出典紐付け済み）", () => {
  it("全ルールが sources 非空を満たし assertRuleSources が通る", () => {
    expect(() => assertRuleSources(interactionRules)).not.toThrow();
    expect(getRuleSourceGaps(interactionRules)).toEqual([]);
  });

  it("high 系ルールは推奨要件（Tier1×2 相当）を満たす（sources 2 件以上）", () => {
    // ガイドライン §4: high は 2 件以上推奨。high しきい値を 2 に上げても通ることを確認。
    expect(() =>
      assertRuleSources(interactionRules, { critical: 1, high: 2, caution: 1 })
    ).not.toThrow();
  });

  it("各ルールの sources は整形式（配列・id/title 非空）", () => {
    for (const r of interactionRules) {
      const srcs = r.sources ?? [];
      expect(Array.isArray(srcs)).toBe(true);
      expect(srcs.length).toBeGreaterThan(0);
      for (const s of srcs) {
        expect(typeof s.id).toBe("string");
        expect(s.id.length).toBeGreaterThan(0);
        expect(typeof s.title).toBe("string");
        expect(s.title.length).toBeGreaterThan(0);
      }
    }
  });
});
