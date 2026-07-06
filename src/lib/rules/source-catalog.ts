import type { SourceRef } from "@/src/types/domain";
import { sourceCatalog } from "@/src/lib/sources";

// カタログ（src/lib/sources.ts）から SourceRef を解決する唯一の入口。
// interactionRules は `src("id")` で参照し、ルールへ SourceRef を直書きしない
// （カタログ一元化の維持）。未登録 id は即 throw して、承認済み対応表との
// 不整合（typo・未登録参照）をビルド/テスト時に早期検出する。
export function src(id: string): SourceRef {
  const ref = sourceCatalog[id];
  if (!ref) {
    throw new Error(`未登録の SourceRef id: ${id}（src/lib/sources.ts に未定義）`);
  }
  return ref;
}
