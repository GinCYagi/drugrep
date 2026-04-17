import { AlertLevel } from "@/src/types/domain";
import { alertLevelLabel } from "@/src/lib/utils/labels";

export function StatusBadge({ level }: { level: AlertLevel }) {
  const className =
    level === "stable"
      ? "bg-zinc-200 text-zinc-900"
      : level === "caution"
      ? "bg-yellow-200 text-yellow-900"
      : level === "high"
      ? "bg-orange-200 text-orange-900"
      : "bg-red-200 text-red-900";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {alertLevelLabel[level]}
    </span>
  );
}