import {
  CombinedRiskResult,
  DoseInput,
  InteractionMatch,
  RiskResult,
  Route,
  ScoreSuppressionReason,
  SourceRef,
  Substance,
  TriggeredRule,
} from "@/src/types/domain";
import { findSubstance } from "@/src/lib/find-substance";
import { interactionRules } from "@/src/lib/rules/interaction-rules";
import { levelFor } from "@/src/lib/rules/score-level";

// finalScore を 0–100 に丸める（式: clamp((base×route×dose)+interaction, 0, 100)）。
// 適用は最終スコア確定の一点のみ（calculateRisk / calculateCombinedRisk）。
function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n));
}

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

// 用量段階（警告段階の決定用）。doseBands の境界から導出（getDoseMultiplier と同じ境界）。
// 0: commonMax 以下（警告なし）/ 1: commonMax超〜highMax以下 /
// 2: highMax超〜veryHighMax以下 / 3: veryHighMax超（モデル適用範囲外）
function doseStage(substance: Substance, doseValue: number): 0 | 1 | 2 | 3 {
  const bands = substance.doseBands;
  if (!bands || !Number.isFinite(doseValue) || doseValue <= 0) return 0;
  if (bands.commonMax !== undefined && doseValue <= bands.commonMax) return 0;
  if (bands.highMax !== undefined && doseValue <= bands.highMax) return 1;
  if (bands.veryHighMax !== undefined && doseValue <= bands.veryHighMax) return 2;
  return 3;
}

// エントリがモデル適用範囲外かを判定し、該当すれば抑制理由コードを返す（純関数）。
// 境界は doseStage（= getDoseMultiplier）と同一。stage 3（veryHighMax 超）= 適用範囲外。
// UI はこの返り値（構造化コード）でスコア非表示を決め、dose 比較を再実装しない。
// ロジック層は範囲外でも数値スコアを返す（このコードは「表示を抑制すべき理由」を表すだけで、
// スコア計算そのものは止めない）。
export function outOfModelRangeReason(
  substance: Substance,
  doseValue: number
): ScoreSuppressionReason | null {
  return doseStage(substance, doseValue) === 3 ? "dose_out_of_model_range" : null;
}

function toRoute(value: string): Route | undefined {
  return value === "oral" || value === "nasal" || value === "rectal"
    ? value
    : undefined;
}

// 単剤 solo スコアの内訳（round 前の生数値）。
// solo = base × routeFactor × doseFactor。計算式はここ一箇所に集約する。
function soloBreakdown(
  substance: Substance,
  doseValue: number,
  route: Route | undefined
): { base: number; routeFactor: number; doseFactor: number; solo: number } {
  const base = sumTagWeights(substance);
  const routeFactor = getRouteMultiplier(substance, route);
  const doseFactor = getDoseMultiplier(substance, doseValue);
  return { base, routeFactor, doseFactor, solo: base * routeFactor * doseFactor };
}

// 単剤の solo スコア（round 前の生数値）。
// calculateCombinedRisk は perDose ごとに本関数を呼び、最終合成時にまとめて round する。
export function computeSoloRisk(
  substance: Substance,
  doseValue: number,
  route: Route | undefined
): number {
  return soloBreakdown(substance, doseValue, route).solo;
}

// interactionRules の発火判定（dedupe 済みの unique substance 集合を渡す）。
// calculateRisk（単剤=1要素）と calculateCombinedRisk の両方から使う共通ロジック。
function evaluateInteractions(uniqueSubstances: Substance[]): {
  triggered: TriggeredRule[];
  interactionAdd: number;
  sources: SourceRef[];
  labels: string[];
} {
  const triggered: TriggeredRule[] = [];
  const sources: SourceRef[] = [];
  const labels: string[] = [];
  let interactionAdd = 0;
  for (const rule of interactionRules) {
    if (matchesAll(rule.requires, uniqueSubstances)) {
      interactionAdd += rule.effect.value;
      triggered.push({
        ruleId: rule.id,
        severity: rule.severity,
        contribution: rule.effect.value,
      });
      labels.push(rule.label);
      if (rule.sources) sources.push(...rule.sources);
    }
  }
  return { triggered, interactionAdd, sources, labels };
}

export function calculateRisk(
  drug: string,
  dose: string,
  route: string
): RiskResult {
  const substance = findSubstance(drug);
  if (!substance) {
    // 未知物質は現段階では score=0 を返す。
    // 将来的には「未知＝評価不能」として unknown ステートを分離する前提。
    // 0（リスクなし）と unknown（判定不能）は本来別概念だが、いまは簡易化のため 0 に潰している。
    return {
      finalScore: 0,
      level: levelFor(0),
      breakdown: { base: 0, routeFactor: 1, doseFactor: 1, interactionAdd: 0 },
      firedInteractions: [],
      warnings: [],
      tags: [],
      sources: [],
    };
  }

  const { base, routeFactor, doseFactor, solo } = soloBreakdown(
    substance,
    Number(dose),
    toRoute(route)
  );

  // 単剤も 1 要素の unique 集合として同じ interaction 判定にかける
  // （1 物質が複数タグを持つ場合は単剤でも発火し得る）。
  const { triggered, interactionAdd, sources, labels } = evaluateInteractions([
    substance,
  ]);

  // finalScore = clamp(round(solo + interactionAdd), 0, 100)。
  const finalScore = clampScore(Math.round(solo + interactionAdd));

  // 用量警告は段階化（モデル相対）。臨床語（常用/治療/承認/安全/推奨）は主語に使わない。
  const stage = doseStage(substance, Number(dose));
  const warnings: string[] = [];
  if (stage === 1) {
    warnings.push("評価モデル上、用量補正が強くなります");
  } else if (stage === 2) {
    warnings.push("評価モデル上、さらに高い用量域として扱われます");
  } else if (stage === 3) {
    warnings.push(
      "評価モデルの適用範囲を超えています。スコア数値は参考表示せず、既知の注意情報のみ表示します"
    );
  }
  warnings.push(...labels);

  return {
    finalScore,
    level: levelFor(finalScore),
    breakdown: { base, routeFactor, doseFactor, interactionAdd },
    firedInteractions: triggered,
    warnings,
    tags: substance.tags.map((t) => t.tag),
    sources,
  };
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

  const { triggered, interactionAdd, sources } = evaluateInteractions(
    uniqueSubstances
  );

  // phase C: 合成（clamp + round は最終のみ）
  const finalScore = clampScore(Math.round(soloTotal + interactionAdd));

  return {
    finalScore,
    soloTotal,
    interactionAdd,
    perDose,
    triggered,
    sources,
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
