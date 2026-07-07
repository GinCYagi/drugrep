import { z } from "zod";
import { findSubstance } from "@/src/lib/find-substance";
import type { Route } from "@/src/types/domain";

// バリデーションはこの層（と evaluate.ts）で完結させ、src/lib/rules/ には持ち込まない。
// 検証パラメータ（存在する物質・許可経路）は substances データから導出する。
// 用量はモデル適用範囲(veryHighMax)を入力ゲートにしない（入力受理とモデル適用範囲は別責務）。
// 現実的な過量入力は受理し、範囲外かどうかは表示側で扱う。

// 入力健全性の上限（機械的異常値ガード）。評価モデルの veryHighMax や臨床上限とは無関係で、
// 桁間違い等の明らかな異常のみを弾く。物質データからは導出しない（意図的な例外）。
const INPUT_SANITY_MAX = 100000;

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

      // dose が正の有限数か（入力健全性）。モデル適用範囲(veryHighMax)は入力ゲートに使わない。
      // 過量入力は受理し、モデル適用範囲外かどうかは表示側（スコア非表示＋「適用範囲外」）で扱う。
      if (!Number.isFinite(entry.dose) || entry.dose <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "dose"],
          message: "用量は正の有限数を入力してください",
        });
      } else if (entry.dose > INPUT_SANITY_MAX) {
        // 極端な機械的異常値（桁間違い等）のみ弾く。モデル/臨床の上限ではない。
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "dose"],
          message: "用量の入力値が大きすぎます。値を確認してください",
        });
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
