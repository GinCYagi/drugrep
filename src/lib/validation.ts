import { z } from "zod";
import { findSubstance } from "@/src/lib/find-substance";
import type { Route } from "@/src/types/domain";

// バリデーションはこの層（と evaluate.ts）で完結させ、src/lib/rules/ には持ち込まない。
// 検証パラメータ（存在する物質・許可経路・用量上限）はすべて substances データから導出する。
// validation.ts にマジックナンバーは書かない。

export type FieldError = {
  entryKey: string;
  field: "substanceId" | "dose" | "route" | "entries";
  message: string;
};

// dose の型ゲートは「JS の number であること」だけに限定し、
// NaN/Infinity/正負/上限の意味検証は superRefine に集約する（z.number は NaN/Infinity を弾くため）。
const doseSchema = z.custom<number>((v) => typeof v === "number", {
  message: "用量は数値で入力してください",
});

const RawEntrySchema = z.object({
  entryKey: z.string(),
  substanceId: z.string(),
  dose: doseSchema,
  route: z.string(),
});

export type RawEntry = z.infer<typeof RawEntrySchema>;

export const RiskInputSchema = z
  .object({
    entries: z.array(RawEntrySchema).min(1, "物質を1件以上追加してください"),
  })
  .superRefine((input, ctx) => {
    input.entries.forEach((entry, i) => {
      // substanceId は正規 id だけでなく別名（商品名・和名・一般名）も受理する。
      // 解決は findSubstance に委譲する（trim + lowercase の完全一致）。
      // 未知の物質名は undefined となり、従来どおり substanceId エラーになる。
      const substance = findSubstance(entry.substanceId);

      // substanceId が substances に存在するか（別名解決を含む）
      if (!substance) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "substanceId"],
          message: "登録されていない物質です",
        });
        return; // 物質不明では経路・上限を判定できない
      }

      // route がその物質の routes に含まれるか（物質×経路の組み合わせ検証）
      const routes = substance.routes ?? [];
      if (!routes.includes(entry.route as Route)) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "route"],
          message: "この物質では選べない投与経路です",
        });
      }

      // dose が正の有限数か
      if (!Number.isFinite(entry.dose) || entry.dose <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "dose"],
          message: "用量は正の有限数を入力してください",
        });
      } else {
        // 上限は doseBands.veryHighMax（内部相対スケールの最大バンド）から導出。
        // 定義が無い物質は導出不能としてスキップする。
        const ceiling = substance.doseBands?.veryHighMax;
        if (ceiling !== undefined && entry.dose > ceiling) {
          ctx.addIssue({
            code: "custom",
            path: ["entries", i, "dose"],
            message: `評価可能な用量の範囲(〜${ceiling}${substance.defaultUnit ?? ""})を超えています。これは評価モデルの適用上限であり、添付文書の承認用量ではありません`,
          });
        }
      }
    });
  });

export type RawRiskInput = z.infer<typeof RiskInputSchema>;

const KNOWN_FIELDS: FieldError["field"][] = [
  "substanceId",
  "dose",
  "route",
  "entries",
];

// ZodError を UI が扱いやすい FieldError[] に写像する（entryKey でグルーピング可能に）。
export function toFieldErrors(
  error: z.ZodError,
  input: RawRiskInput
): FieldError[] {
  return error.issues.map((issue) => {
    const path = issue.path;
    // ["entries", i, field] → 各エントリのフィールド
    if (path.length >= 3 && path[0] === "entries" && typeof path[1] === "number") {
      const idx = path[1];
      const rawField = path[2];
      const field = KNOWN_FIELDS.includes(rawField as FieldError["field"])
        ? (rawField as FieldError["field"])
        : "entries";
      return {
        entryKey: input.entries[idx]?.entryKey ?? "",
        field,
        message: issue.message,
      };
    }
    // ["entries"] （min(1) 違反など）→ entries 全体
    return { entryKey: "", field: "entries", message: issue.message };
  });
}
