import { Substance } from "@/src/types/domain";
import { substances } from "@/src/lib/substances";

export function findSubstance(input: string): Substance | undefined {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return undefined;

  for (const s of substances) {
    if (s.id.toLowerCase() === normalized) return s;
    if (s.aliases?.some((a) => a.toLowerCase() === normalized)) return s;
    if (s.genericName && s.genericName.toLowerCase() === normalized) return s;
    if (s.displayName.toLowerCase() === normalized) return s;
  }

  return undefined;
}
