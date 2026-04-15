import { AlertLevel, RiskTag, Route } from "@/types/domain";

export const alertLevelLabel: Record<AlertLevel, string> = {
  stable: "安定",
  caution: "注意",
  high: "高警戒",
  critical: "緊急確認推奨",
};

export const routeLabel: Record<Route, string> = {
  oral: "経口",
  sublingual: "舌下",
  rectal: "直腸",
  sniff: "経鼻",
  inhaled: "吸入",
  other: "その他",
};

export const riskTagLabel: Record<RiskTag, string> = {
  stimulant: "刺激↑",
  depressant: "鎮静↑",
  serotonergic: "セロトニン↑",
  anticholinergic: "抗コリン↑",
  seizure_threshold_lowering: "けいれん閾値↓",
  respiratory_depression: "呼吸抑制↑",
  blood_pressure_up: "血圧上昇↑",
  blood_pressure_down: "血圧低下↑",
  heart_rate_up: "心拍負荷↑",
  arrhythmia_risk: "不整脈寄与↑",
  dissociative: "解離↑",
  opioid_like: "オピオイド様↑",
  sedative_hypnotic: "睡眠薬様↑",
};