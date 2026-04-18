import {
  CombinedRiskResult,
  DoseInput,
  InteractionMatch,
  Route,
  Substance,
  TriggeredRule,
} from "@/src/types/domain";
import { findSubstance } from "@/src/lib/find-substance";
import { interactionRules } from "@/src/lib/rules/interaction-rules";

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

// 単剤の solo スコア（round 前の生数値）。
// calculateCombinedRisk は perDose ごとに本関数を呼び、最終合成時にまとめて round する。
export function computeSoloRisk(
  substance: Substance,
  doseValue: number,
  route: Route | undefined
): number {
  const base = sumTagWeights(substance);
  const routeMultiplier = getRouteMultiplier(substance, route);
  const doseMultiplier = getDoseMultiplier(substance, doseValue);
  return base * routeMultiplier * doseMultiplier;
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
  return Math.round(
    computeSoloRisk(substance, Number(dose), toRoute(route))
  );
}

// 複数薬剤評価。
// - solo 計算は entries の件数ベース（同一薬の重複入力は soloTotal に加算される）
// - interaction 判定は dedupe 後の unique substance.id 集合を用いる
// - 未知物質は perDose には残し（soloScore: 0）、interaction 判定集合からは除外する
// - findSubstance は各 entry に対して 1 回だけ呼び、結果を再利用する
export function calculateCombinedRisk(
  entries: DoseInput[]
): CombinedRiskResult {
  const resolved = entries.map((entry) => ({
    entry,
    substance: findSubstance(entry.drug),
  }));

  // phase A: solo 計算（件数ベース）
  const perDose = resolved.map(({ entry, substance }) => {
    if (!substance) {
      return { drug: entry.drug, soloScore: 0 };
    }
    return {
      drug: entry.drug,
      soloScore: computeSoloRisk(
        substance,
        Number(entry.dose),
        toRoute(entry.route)
      ),
    };
  });
  const soloTotal = perDose.reduce((acc, p) => acc + p.soloScore, 0);

  // phase B: interaction 判定（dedupe 後の unique substance 集合）
  const uniqueSubstances = dedupeById(
    resolved
      .map((r) => r.substance)
      .filter((s): s is Substance => s !== undefined)
  );

  const triggered: TriggeredRule[] = [];
  let interactionAdd = 0;
  for (const rule of interactionRules) {
    if (matchesAll(rule.requires, uniqueSubstances)) {
      interactionAdd += rule.effect.value;
      triggered.push({
        ruleId: rule.id,
        severity: rule.severity,
        contribution: rule.effect.value,
      });
    }
  }

  // phase C: 合成（round は最終のみ）
  const finalScore = Math.round(soloTotal + interactionAdd);

  return {
    finalScore,
    soloTotal,
    interactionAdd,
    perDose,
    triggered,
  };
}

function dedupeById(substances: Substance[]): Substance[] {
  const seen = new Set<string>();
  const result: Substance[] = [];
  for (const s of substances) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push(s);
  }
  return result;
}

function matchesAll(
  requires: InteractionMatch[],
  uniqueSubstances: Substance[]
): boolean {
  for (const req of requires) {
    if (req.kind === "substance") {
      if (!uniqueSubstances.some((s) => s.id === req.id)) return false;
    } else {
      const minCount = req.minCount ?? 1;
      const count = uniqueSubstances.filter((s) =>
        s.tags.some((t) => t.tag === req.tag)
      ).length;
      if (count < minCount) return false;
    }
  }
  return true;
}
