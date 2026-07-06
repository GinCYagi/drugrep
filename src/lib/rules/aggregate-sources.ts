import type { SourceRef } from "@/src/types/domain";

// 発火ルール由来で連結された SourceRef 配列を、表示用に集約する純関数。
//
// evaluateInteractions は複数ルールの sources を dedupe せずに連結する
// （RiskResult.sources / CombinedRiskResult.sources は「dedupe 前の連結」）。
// 同一出典を複数ルールが参照すると重複するため、表示層でここに集約する。
//
// 仕様:
//   - id を一意キーに重複除去する。
//   - 初出の順序を保つ（表示順の安定性 = golden/UI の予測可能性）。
//   - 同一 id が複数あった場合は「初出のエントリ」を採用する（title/url/note 込み）。
//     ルール文脈で note を変えている場合の統合ポリシーは Post-MVP（現状は初出優先）。
export function aggregateSources(sources: readonly SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const result: SourceRef[] = [];
  for (const s of sources) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push(s);
  }
  return result;
}
