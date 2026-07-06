import type { InteractionRule, InteractionSeverity } from "@/src/types/domain";

// interactionRules の「各ルールは出典を最低件数持つ」不変条件を検査する層。
//
// 方針（docs/task5c-implementation-plan.md §4 / §7）:
//   - 「量（sources 非空）は機械、質（出典の妥当性）は人間」で役割分担する。
//   - 実行時（モジュール読込時）には throw しない。MVP 安定性を優先し、
//     検証はテスト経路からのみ呼ぶ。app 実行中に出典未整備でクラッシュさせない。
//   - 実データ整備前は「非空（1 件以上）」を最低ラインとする。high/critical を
//     将来 2 件へ引き上げる場合は minBySeverity を渡して段階的に厳格化する。

export type RuleSourceGap = {
  ruleId: string;
  severity: InteractionSeverity;
  have: number; // 実際の sources 件数（undefined は 0 として扱う）
  need: number; // severity 別の最低要求件数
};

// severity 別の最低 sources 件数（既定）。
// 現段階は全 severity で「1 件以上（非空）」。段階的引き上げは呼び出し側で上書きする。
export const DEFAULT_MIN_BY_SEVERITY: Record<InteractionSeverity, number> = {
  critical: 1,
  high: 1,
  caution: 1,
};

// 各ルールの sources 件数が severity 別の最低要件を満たすか検査し、
// 不足しているルールの一覧（gap）を返す純関数。throw しない。
// sources が未定義（キーなし）の場合は 0 件として扱う。
export function getRuleSourceGaps(
  rules: readonly InteractionRule[],
  minBySeverity: Record<InteractionSeverity, number> = DEFAULT_MIN_BY_SEVERITY
): RuleSourceGap[] {
  const gaps: RuleSourceGap[] = [];
  for (const rule of rules) {
    const have = rule.sources?.length ?? 0;
    const need = minBySeverity[rule.severity];
    if (have < need) {
      gaps.push({ ruleId: rule.id, severity: rule.severity, have, need });
    }
  }
  return gaps;
}

// getRuleSourceGaps に基づき、不足があれば Error を throw する厳格版。
// テスト時検証（および将来 CI での退行検出）を想定。実行時経路からは呼ばない。
export function assertRuleSources(
  rules: readonly InteractionRule[],
  minBySeverity: Record<InteractionSeverity, number> = DEFAULT_MIN_BY_SEVERITY
): void {
  const gaps = getRuleSourceGaps(rules, minBySeverity);
  if (gaps.length > 0) {
    const detail = gaps
      .map((g) => `${g.ruleId}(${g.severity}): ${g.have}/${g.need}`)
      .join(", ");
    throw new Error(`interactionRules に出典が不足しています: ${detail}`);
  }
}
