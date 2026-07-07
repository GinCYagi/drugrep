import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { substances } from "@/src/lib/substances";

// =============================================================================
// Contract Check (C12): substances.ts の全物質が最低1本の golden テストに登場すること。
//
// 目的: 物質を substances.ts に追加したのに golden を書き忘れると、この Contract が
// 失敗して CI（vitest）を停止させる。「スコアが動く物質が golden 未固定」を防ぐ。
//
// 「登場」の定義: golden テストのソース中に、その物質の
//   id / genericName / displayName / alias のいずれかがリテラルとして現れること。
// （実行結果ではなくソースの静的走査で判定する。導出型 golden の自動生成=G2 は Post-MVP。）
//
// 走査対象（= 「golden」とみなすテストファイル）:
//   - evaluate.golden.test.ts（リテラル固定ゴールデンの正典）
//   - rules/calculate-risk.test.ts（下位層ゴールデン）
// 新しい golden ファイルを足したら、その物質がここに登場するよう本リストに加える。
// =============================================================================

const here = dirname(fileURLToPath(import.meta.url));

const GOLDEN_FILES = [
  join(here, "evaluate.golden.test.ts"),
  join(here, "..", "rules", "calculate-risk.test.ts"),
];

function goldenCorpus(): string {
  return GOLDEN_FILES.map((f) => readFileSync(f, "utf8")).join("\n");
}

// 物質を一意に指せるトークン（id/genericName/displayName/aliases）。
function tokensFor(s: (typeof substances)[number]): string[] {
  return [s.id, s.genericName, s.displayName, ...(s.aliases ?? [])].filter(
    (t): t is string => typeof t === "string" && t.length > 0
  );
}

describe("Contract: substances.ts の全物質が golden に登場する（C12）", () => {
  it("golden 未登場の物質が存在しない（追加忘れを CI で停止）", () => {
    const corpus = goldenCorpus();

    const uncovered = substances
      .filter((s) => !tokensFor(s).some((t) => corpus.includes(t)))
      .map((s) => s.id);

    // 失敗時にどの物質の golden が無いかを明示する。
    expect(
      uncovered,
      `golden 未登場の物質: ${uncovered.join(", ") || "(なし)"}。` +
        ` substances.ts に追加した物質は evaluate.golden.test.ts 等に golden を書くこと。`
    ).toEqual([]);
  });

  it("走査対象の golden ファイルが読み込めている（空コーパスで誤 pass しない）", () => {
    expect(goldenCorpus().length).toBeGreaterThan(0);
  });
});
