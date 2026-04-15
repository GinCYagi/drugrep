import { Alert, AlertLevel, DoseEvent, Substance } from "@/types/domain";
import { computeActiveLoad } from "./compute-active-load";

function maxLevel(a: AlertLevel, b: AlertLevel): AlertLevel {
  const order: AlertLevel[] = ["stable", "caution", "high", "critical"];
  return order.indexOf(a) > order.indexOf(b) ? a : b;
}

export function evaluateCurrentAlert(
  events: DoseEvent[],
  substances: Substance[],
  nowIso: string
): Alert {
  const load = computeActiveLoad(events, substances, nowIso);

  let level: AlertLevel = "stable";
  const reasons: string[] = [];

  if (load.stimulant >= 5) {
    level = maxLevel(level, "high");
    reasons.push("短時間に刺激作用が重複しています");
  }

  if (load.stimulant >= 4 && (load.heartRateUp + load.arrhythmiaRisk) >= 4) {
    level = maxLevel(level, "high");
    reasons.push("刺激作用と心血管負荷の重なりがあります");
  }

  if (load.depressant >= 3 && load.respiratoryDepression >= 2) {
    level = maxLevel(level, "high");
    reasons.push("鎮静と呼吸抑制の重なりがあります");
  }

  if (load.serotonergic >= 3) {
    level = maxLevel(level, "caution");
    reasons.push("セロトニン作用の重なりがあります");
  }

  if (load.seizureThresholdLowering >= 2 && load.stimulant >= 3) {
    level = maxLevel(level, "high");
    reasons.push("けいれん閾値低下寄与と刺激作用が重なっています");
  }

  const nightEvents = events.filter((e) => {
    const hour = new Date(e.takenAt).getHours();
    return hour >= 0 && hour < 5;
  });

  if (nightEvents.length >= 2) {
    level = maxLevel(level, "caution");
    reasons.push("深夜帯の連続使用パターンです");
  }

  if (reasons.length === 0) {
    reasons.push("現時点では強い重なりは少なめです");
  }

  return {
    id: "current-alert",
    level,
    title:
      level === "stable"
        ? "大きな警告はありません"
        : level === "caution"
        ? "注意が必要です"
        : level === "high"
        ? "高警戒の重なりがあります"
        : "緊急確認が必要な可能性があります",
    reasons: reasons.slice(0, 3),
    relatedEventIds: events.map((e) => e.id),
    createdAt: nowIso,
  };
}