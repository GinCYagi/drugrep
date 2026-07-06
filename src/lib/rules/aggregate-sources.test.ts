import { describe, it, expect } from "vitest";
import { aggregateSources } from "@/src/lib/rules/aggregate-sources";
import { interactionRules } from "@/src/lib/rules/interaction-rules";
import type { SourceRef } from "@/src/types/domain";

const A: SourceRef = { id: "pi-tramadol", title: "トラムセット 電子添文" };
const B: SourceRef = { id: "pmda-safety-01", title: "PMDA 安全性情報" };

describe("aggregateSources", () => {
  it("空配列は空配列を返す", () => {
    expect(aggregateSources([])).toEqual([]);
  });

  it("重複が無ければ入力をそのまま（順序保持で）返す", () => {
    expect(aggregateSources([A, B])).toEqual([A, B]);
  });

  it("同一 id は重複除去し、初出のエントリを採用する", () => {
    const dupWithOtherNote: SourceRef = {
      id: "pi-tramadol",
      title: "別タイトル",
      note: "後勝ちしてはいけない",
    };
    const out = aggregateSources([A, B, dupWithOtherNote]);
    // 初出 A が残り、後続の同一 id は捨てられる。
    expect(out).toEqual([A, B]);
    expect(out).toHaveLength(2);
  });

  it("初出の順序を保つ（安定ソート）", () => {
    const out = aggregateSources([B, A, B, A]);
    expect(out.map((s) => s.id)).toEqual(["pmda-safety-01", "pi-tramadol"]);
  });

  it("実 interactionRules の sources を連結しても id 重複が発生しない", () => {
    // 現状は全ルール sources 未整備のため空だが、将来データが入っても
    // 集約後に id 重複が無いことをここで保証する（構造ゴールデン）。
    const all = aggregateSources(
      interactionRules.flatMap((r) => r.sources ?? [])
    );
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
