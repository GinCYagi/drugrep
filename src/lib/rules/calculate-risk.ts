import { Route, Substance } from "@/src/types/domain";
import { findSubstance } from "@/src/lib/find-substance";

// routeFactor は暫定補正。吸収速度・バイオアベイラビリティの大小関係を
// 粗く反映した値で、将来的に文献ベースの係数に置き換える前提。
const ROUTE_FACTOR: Record<Route, number> = {
  oral: 1.0,
  nasal: 1.4,
  rectal: 1.3,
};

function sumTagWeights(substance: Substance): number {
  // substance.tags の weight は「その物質単体での危険度寄与」を表す値。
  // 将来の interactionRules（相互作用ルール）で使う重みとは別軸なので、
  // 併用・逓増評価のための重みとして流用しないこと。
  return substance.tags.reduce((acc, t) => acc + t.weight, 0);
}

function getRouteMultiplier(
  substance: Substance,
  route: Route | undefined
): number {
  if (!route) return 1.0;
  // substance.routes に含まれない route は「その物質に対して非対応」とみなし、
  // 補正を掛けず 1.0 にする（データ側の routes 定義を経路バリデーションとして活かす）。
  // routes が未定義の物質は対応経路の情報が無いため、便宜上 ROUTE_FACTOR をそのまま適用する。
  if (substance.routes && !substance.routes.includes(route)) return 1.0;
  return ROUTE_FACTOR[route];
}

function getDoseMultiplier(substance: Substance, doseValue: number): number {
  const bands = substance.doseBands;
  if (!bands || !Number.isFinite(doseValue) || doseValue <= 0) return 1.0;

  if (bands.commonMax !== undefined && doseValue <= bands.commonMax) return 1.0;
  if (bands.highMax !== undefined && doseValue <= bands.highMax) return 1.3;
  if (bands.veryHighMax !== undefined && doseValue <= bands.veryHighMax) return 1.6;
  return 2.0;
}

function toRoute(value: string): Route | undefined {
  return value === "oral" || value === "nasal" || value === "rectal"
    ? value
    : undefined;
}

export function calculateRisk(
  drug: string,
  dose: string,
  route: string
): number {
  const substance = findSubstance(drug);
  if (!substance) {
    // 未知物質は現段階では score=0 を返す。
    // 将来的には「未知＝評価不能」として unknown ステートを分離する前提。
    // 0（リスクなし）と unknown（判定不能）は本来別概念だが、いまは簡易化のため 0 に潰している。
    return 0;
  }

  const base = sumTagWeights(substance);
  const normalizedRoute = toRoute(route);
  const routeMultiplier = getRouteMultiplier(substance, normalizedRoute);
  const doseMultiplier = getDoseMultiplier(substance, Number(dose));

  return Math.round(base * routeMultiplier * doseMultiplier);
}
