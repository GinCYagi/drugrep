import { describe, it, expect } from "vitest";
import { src } from "@/src/lib/rules/source-catalog";
import { sourceCatalog } from "@/src/lib/sources";

describe("src — SourceRef カタログ解決", () => {
  it("既知 id は対応する SourceRef を返す", () => {
    const ref = src("tramadol-acetaminophen_tramset_pi_20240823");
    expect(ref.id).toBe("tramadol-acetaminophen_tramset_pi_20240823");
    expect(ref.title.length).toBeGreaterThan(0);
  });

  it("未登録 id は throw する（対応表との不整合を早期検出）", () => {
    expect(() => src("no-such-id")).toThrow(/未登録の SourceRef id/);
  });
});

describe("sourceCatalog — カタログの健全性", () => {
  it("各エントリは key と id が一致し title 非空", () => {
    for (const [key, ref] of Object.entries(sourceCatalog)) {
      expect(ref.id).toBe(key);
      expect(typeof ref.title).toBe("string");
      expect(ref.title.length).toBeGreaterThan(0);
    }
  });

  it("url は全件未設定（別タスクで付与予定・創作しない）", () => {
    for (const ref of Object.values(sourceCatalog)) {
      expect(ref.url).toBeUndefined();
    }
  });
});
