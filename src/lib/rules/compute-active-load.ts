import { DerivedLoad, DoseEvent, RiskTagWeight, Substance } from "@/src/types/domain";

function getSubstanceMap(substances: Substance[]) {
  return new Map(substances.map((s) => [s.id, s]));
}

function getResidualFactor(hoursSince: number, halfLife = 6): number {
  if (hoursSince < 0) return 0;
  if (hoursSince <= halfLife) return 1;
  if (hoursSince <= halfLife * 2) return 0.5;
  if (hoursSince <= halfLife * 3) return 0.25;
  return 0;
}

function applyTag(
  load: DerivedLoad,
  tag: RiskTagWeight,
  factor: number
): DerivedLoad {
  const value = tag.weight * factor;

  switch (tag.tag) {
    case "stimulant":
      load.stimulant += value;
      break;
    case "depressant":
      load.depressant += value;
      break;
    case "serotonergic":
      load.serotonergic += value;
      break;
    case "anticholinergic":
      load.anticholinergic += value;
      break;
    case "respiratory_depression":
      load.respiratoryDepression += value;
      break;
    case "blood_pressure_up":
      load.bloodPressureUp += value;
      break;
    case "blood_pressure_down":
      load.bloodPressureDown += value;
      break;
    case "heart_rate_up":
      load.heartRateUp += value;
      break;
    case "arrhythmia_risk":
      load.arrhythmiaRisk += value;
      break;
    case "sedative_hypnotic":
      load.sedativeHypnotic += value;
      break;
    case "seizure_threshold_lowering":
      load.seizureThresholdLowering += value;
      break;
    default:
      break;
  }

  return load;
}

export function computeActiveLoad(
  events: DoseEvent[],
  substances: Substance[],
  nowIso: string
): DerivedLoad {
  const now = new Date(nowIso).getTime();
  const substanceMap = getSubstanceMap(substances);

  const base: DerivedLoad = {
    stimulant: 0,
    depressant: 0,
    serotonergic: 0,
    anticholinergic: 0,
    respiratoryDepression: 0,
    bloodPressureUp: 0,
    bloodPressureDown: 0,
    heartRateUp: 0,
    arrhythmiaRisk: 0,
    sedativeHypnotic: 0,
    seizureThresholdLowering: 0,
  };

  for (const event of events) {
    const substance = substanceMap.get(event.substanceId);
    if (!substance) continue;

    const takenAt = new Date(event.takenAt).getTime();
    const hoursSince = (now - takenAt) / (1000 * 60 * 60);
    const halfLife = substance.halfLifeHours?.max ?? 6;
    const factor = getResidualFactor(hoursSince, halfLife);

    if (factor <= 0) continue;

    for (const tag of substance.tags) {
      applyTag(base, tag, factor);
    }
  }

  return base;
}