// 現段階のUI対応語彙のみ。sublingual / inhaled / その他の投与経路は
// 必要になった段階で拡張する前提で、一旦 oral / nasal / rectal に絞っている。
export type Route = "oral" | "nasal" | "rectal";

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
  // 表記ゆれ吸収用。商品名・略号・カタカナ表記を想定（スペルミス吸収は対象外）。
  aliases?: string[];
  // アプリ内部の相対評価閾値（`defaultUnit` 基準）。添付文書の上限値ではない。
  // calculateRisk の用量補正係数を決めるためのスケール。
  doseBands?: {
    commonMax?: number;
    highMax?: number;
    veryHighMax?: number;
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

// ---- 文献参照（将来 about ページや InteractionRule.sources で使用） ----
export type SourceRef = {
  id: string;
  title: string;
  url?: string;
  note?: string;
};

// ---- 相互作用ルール ----
// interactionRules は「複数要素の組合せ」を評価するレイヤ。
// 単剤の solo 評価は Substance.tags.weight / doseBands / routes 側で行う（責務分離）。
// 同一 substance.id を複数エントリ入力した場合、評価側で dedupe してから
// substance match / tag minCount の判定に用いる（量的過量は doseBands 側で扱う）。
export type InteractionMatch =
  | { kind: "substance"; id: string }
  | { kind: "tag"; tag: RiskTag; minCount?: number };

// MVP は add のみ。将来 multiply を戻せるよう union 形状は保持。
export type InteractionEffect = { kind: "add"; value: number };

// InteractionSeverity は AlertLevel（"stable" を含む）と別軸。
// ルール自体が stable を取り得ないため、意図的に分離。
export type InteractionSeverity = "caution" | "high" | "critical";

export type InteractionRule = {
  id: string;
  label: string;
  description?: string;
  severity: InteractionSeverity;
  requires: InteractionMatch[]; // AND セマンティクス
  effect: InteractionEffect;
  sources?: SourceRef[];
};

// ---- 複数薬剤評価の入出力 ----
export type DoseInput = {
  drug: string;
  dose: string;
  route: string;
};

export type TriggeredRule = {
  ruleId: string;
  severity: InteractionSeverity;
  contribution: number;
};

export type CombinedRiskResult = {
  finalScore: number;
  soloTotal: number;
  interactionAdd: number;
  perDose: { drug: string; soloScore: number }[];
  triggered: TriggeredRule[];
};