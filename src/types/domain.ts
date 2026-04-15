export type Route =
  | "oral"
  | "sublingual"
  | "rectal"
  | "sniff"
  | "inhaled"
  | "other";

export type AlertLevel = "stable" | "caution" | "high" | "critical";

export type RiskTag =
  | "stimulant"
  | "depressant"
  | "serotonergic"
  | "anticholinergic"
  | "seizure_threshold_lowering"
  | "respiratory_depression"
  | "blood_pressure_up"
  | "blood_pressure_down"
  | "heart_rate_up"
  | "arrhythmia_risk"
  | "dissociative"
  | "opioid_like"
  | "sedative_hypnotic";

export type RiskTagWeight = {
  tag: RiskTag;
  weight: 0 | 1 | 2 | 3;
};

export type SubstanceCategory = "prescription" | "otc" | "other";

export type Substance = {
  id: string;
  displayName: string;
  genericName?: string;
  category: SubstanceCategory;
  defaultUnit?: string;
  routes?: Route[];
  tags: RiskTagWeight[];
  halfLifeHours?: {
    min?: number;
    max?: number;
  };
};

export type DoseEvent = {
  id: string;
  substanceId: string;
  takenAt: string;
  doseValue: number;
  doseUnit: string;
  route: Route;
  note?: string;
  category?: SubstanceCategory;
  duplicateIntake?: boolean;
  symptoms?: string[];
};

export type DerivedLoad = {
  stimulant: number;
  depressant: number;
  serotonergic: number;
  anticholinergic: number;
  respiratoryDepression: number;
  bloodPressureUp: number;
  bloodPressureDown: number;
  heartRateUp: number;
  arrhythmiaRisk: number;
  sedativeHypnotic: number;
  seizureThresholdLowering: number;
};

export type Alert = {
  id: string;
  level: AlertLevel;
  title: string;
  reasons: string[];
  relatedEventIds: string[];
  createdAt: string;
};

export type DailySummary = {
  date: string;
  maxAlertLevel: AlertLevel;
  alertCount: number;
  eventCount: number;
  topReasons: string[];
};