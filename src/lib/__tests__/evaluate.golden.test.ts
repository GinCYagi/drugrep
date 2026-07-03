import { describe, it, expect } from "vitest";
import { evaluateRisk } from "@/src/lib/evaluate";
import {
  calculateRisk,
  calculateCombinedRisk,
} from "@/src/lib/rules/calculate-risk";
import type { RawRiskInput } from "@/src/lib/validation";
import type { RiskResult, RiskTag } from "@/src/types/domain";

// =============================================================================
// ゴールデンテスト（MVP 挙動固定）
//
// このファイルは「現在の実装が返す値」をそのままリテラルとして固定するテスト。
// 期待値はルールの重みから推測して書いたものではなく、実装を実行して得た
// 実測値を転記している。目的はスコアだけでなく RiskResult / 各結果の
// 構造全体（breakdown・firedInteractions・warnings・tags・sources 等）を
// 固定し、意図しない挙動変更・構造変更を検出すること。
//
// 期待値を更新してよいのは「意図的に仕様を変更したとき」だけ。
// テストが落ちたら、まず「仕様変更の意図があるか」を確認すること。
// 意図しない差分であれば実装側のリグレッションを疑う。
//
// スナップショット（--update で気軽に更新できてしまう方式）は使わず、
// ファイル内で読めるリテラルとして期待値を明示している。
// =============================================================================

// 単一エントリ入力を組み立てるヘルパ。既存 substances の実データを使う（スタブなし）。
// methylphenidate: routes=oral/rectal/nasal, tags weight 合計=8,
//                  doseBands={commonMax:60, highMax:80, veryHighMax:120}
function input(
  over: Partial<{
    entryKey: string;
    substanceId: string;
    dose: number;
    route: string;
  }> = {}
): RawRiskInput {
  return {
    entries: [
      {
        entryKey: "k1",
        substanceId: "methylphenidate",
        dose: 30,
        route: "oral",
        ...over,
      },
    ],
  };
}

// 全成功ケースで共通の tags（methylphenidate のタグ並び）。
const MPH_TAGS: RiskTag[] = [
  "stimulant",
  "heart_rate_up",
  "blood_pressure_up",
  "arrhythmia_risk",
];

describe("evaluateRisk — golden (success)", () => {
  it("一般的な投与経路・通常量の単剤はベースラインの低リスクになる", () => {
    // methylphenidate / oral / dose=30（commonMax=60 以下）
    // solo = base(8) × routeFactor(oral=1) × doseFactor(1.0) = 8
    const res = evaluateRisk(input());
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const expected: RiskResult = {
      finalScore: 8,
      breakdown: { base: 8, routeFactor: 1, doseFactor: 1, interactionAdd: 0 },
      firedInteractions: [],
      warnings: [],
      tags: ["stimulant", "heart_rate_up", "blood_pressure_up", "arrhythmia_risk"],
      sources: [],
    };
    expect(res.result).toEqual(expected);
  });

  it("同じ用量でも鼻腔投与は経口投与よりスコアが高くなる（経路倍率のみ変化）", () => {
    // dose/物質はベースラインと同一、route だけ nasal に変更。
    // routeFactor: oral=1.0 → nasal=1.4 のみが差分。
    // solo = 8 × 1.4 × 1.0 = 11.2 → round=11
    const oral = evaluateRisk(input());
    const nasal = evaluateRisk(input({ route: "nasal" }));
    expect(oral.ok && nasal.ok).toBe(true);
    if (!oral.ok || !nasal.ok) return;

    const expected: RiskResult = {
      finalScore: 11,
      breakdown: { base: 8, routeFactor: 1.4, doseFactor: 1, interactionAdd: 0 },
      firedInteractions: [],
      warnings: [],
      tags: MPH_TAGS,
      sources: [],
    };
    expect(nasal.result).toEqual(expected);

    // 経路以外は同一構造で、finalScore と routeFactor だけが上がっていること。
    expect(nasal.result.finalScore).toBeGreaterThan(oral.result.finalScore);
    expect(nasal.result.breakdown.routeFactor).toBeGreaterThan(
      oral.result.breakdown.routeFactor
    );
    expect(nasal.result.breakdown.base).toBe(oral.result.breakdown.base);
    expect(nasal.result.breakdown.doseFactor).toBe(
      oral.result.breakdown.doseFactor
    );
  });

  it("常用域を超える用量では用量係数が上がりスコアと警告が増える", () => {
    // methylphenidate / oral / dose=70（commonMax=60 超, highMax=80 以下）
    // doseFactor: 1.0 → 1.3。solo = 8 × 1.0 × 1.3 = 10.4 → round=10。
    // doseFactor>1 のとき warnings に「常用域超え」メッセージが入る。
    const res = evaluateRisk(input({ dose: 70 }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const expected: RiskResult = {
      finalScore: 10,
      breakdown: { base: 8, routeFactor: 1, doseFactor: 1.3, interactionAdd: 0 },
      firedInteractions: [],
      warnings: ["設定用量が常用域を超えています"],
      tags: MPH_TAGS,
      sources: [],
    };
    expect(res.result).toEqual(expected);

    // ベースライン（dose=30, doseFactor=1, warnings=[]）比でリスクが上がっている。
    const base = evaluateRisk(input());
    expect(base.ok).toBe(true);
    if (!base.ok) return;
    expect(res.result.finalScore).toBeGreaterThan(base.result.finalScore);
    expect(res.result.breakdown.doseFactor).toBeGreaterThan(
      base.result.breakdown.doseFactor
    );
    expect(res.result.warnings.length).toBeGreaterThan(
      base.result.warnings.length
    );
  });

  it("経路・用量が最大でも finalScore は 100 に達せずクランプは発生しない（現状のMVP挙動）", () => {
    // 有効入力の中で最大級: nasal(1.4) × dose=120(veryHighMax, doseFactor=1.6)。
    // solo = 8 × 1.4 × 1.6 = 17.92 → round=18。
    // 実装には clamp(0..100) が無く、単剤ではそもそも 100 近傍に到達しない。
    // ここでは「クランプされない実際の上端挙動」を固定する。
    const res = evaluateRisk(input({ dose: 120, route: "nasal" }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const expected: RiskResult = {
      finalScore: 18,
      breakdown: { base: 8, routeFactor: 1.4, doseFactor: 1.6, interactionAdd: 0 },
      firedInteractions: [],
      warnings: ["設定用量が常用域を超えています"],
      tags: MPH_TAGS,
      sources: [],
    };
    expect(res.result).toEqual(expected);
    expect(res.result.finalScore).toBeLessThan(100);
  });

  it("成功ケースの RiskResult は必須フィールドをすべて備える（構造ゴールデン）", () => {
    // score だけでなく構造全体（キー集合）を固定し、フィールドの増減を検出する。
    const res = evaluateRisk(input());
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.result).toMatchObject({
      finalScore: expect.any(Number),
      breakdown: {
        base: expect.any(Number),
        routeFactor: expect.any(Number),
        doseFactor: expect.any(Number),
        interactionAdd: expect.any(Number),
      },
      firedInteractions: expect.any(Array),
      warnings: expect.any(Array),
      tags: expect.any(Array),
      sources: expect.any(Array),
    });
    expect(Object.keys(res.result).sort()).toEqual(
      [
        "breakdown",
        "finalScore",
        "firedInteractions",
        "sources",
        "tags",
        "warnings",
      ].sort()
    );
  });

  it("別名（商品名・和名・一般名）入力でも正規 id と同一の評価結果になる", () => {
    // 【Task5A 修正で挙動変更】以前は validation が正規 id 完全一致のみ受理し、
    // 別名は evaluateRisk で substanceId エラーになっていた。修正後は validation が
    // findSubstance で別名解決するため、別名入力も受理され正規 id と同一結果を返す。
    const canonical = evaluateRisk(input());
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;

    // methylphenidate の別名: リタリン/ritalin/mph（alias）、
    // メチルフェニデート（displayName）、Methylphenidate（genericName）。
    for (const alias of [
      "リタリン",
      "ritalin",
      "mph",
      "メチルフェニデート",
      "Methylphenidate",
    ]) {
      const res = evaluateRisk(input({ substanceId: alias }));
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.result).toEqual(canonical.result);
    }
  });
});

describe("evaluateRisk — golden (interaction)", () => {
  it("複数物質入力（tramadol_combo + moclobemide）で相互作用が finalScore に加算される", () => {
    // 【Task5A 修正で挙動変更】以前の evaluateRisk は entries[0] の単剤しか評価せず、
    // 相互作用は常に非発火（firedInteractions:[], interactionAdd:0）だった。
    // 修正後は複数エントリを calculateCombinedRisk に委譲して相互作用を発火させる。
    //
    // soloTotal = 7(tramadol_combo) + 2(moclobemide) = 9
    // interactionAdd = 10（maoi_plus_serotonergic）
    // finalScore = round(9 + 10) = 19
    const res = evaluateRisk({
      entries: [
        { entryKey: "a", substanceId: "tramadol_combo", dose: 2, route: "oral" },
        { entryKey: "b", substanceId: "moclobemide", dose: 300, route: "oral" },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const expected: RiskResult = {
      finalScore: 19,
      // 集計 breakdown: base=soloTotal(9), route/dose 係数は各エントリで消化済みのため 1。
      breakdown: { base: 9, routeFactor: 1, doseFactor: 1, interactionAdd: 10 },
      firedInteractions: [
        { ruleId: "maoi_plus_serotonergic", severity: "high", contribution: 10 },
      ],
      // 各エントリとも常用域内（tramadol 2錠 / moclobemide 300mg）で用量警告なし。
      warnings: [],
      // tags は各エントリの和集合（tramadol_combo の5タグ + moclobemide の serotonergic は既出）。
      tags: [
        "opioid_like",
        "respiratory_depression",
        "serotonergic",
        "seizure_threshold_lowering",
        "depressant",
      ],
      // NOTE(sources): 相互作用は発火しているが sources は現状 []。
      //   interactionRules のどの rule も sources を定義しておらず、コードベースに
      //   参照カタログも存在しないため（捏造禁止方針により未追加）。
      //   伝播経路自体は combined.sources → RiskResult.sources で配線済み。
      //   ルールに sources データが入れば、この期待値は非空へ更新する想定。
      sources: [],
    };
    expect(res.result).toEqual(expected);

    // 相互作用が実際に発火し、finalScore に反映されていること（構造非依存の確認）。
    expect(res.result.firedInteractions.length).toBeGreaterThan(0);
    expect(res.result.breakdown.interactionAdd).toBeGreaterThan(0);
    expect(res.result.firedInteractions[0]).toMatchObject({
      ruleId: "maoi_plus_serotonergic",
      contribution: res.result.breakdown.interactionAdd,
    });
  });

  it("複数物質を別名で入力しても正規 id 入力と同一の集計結果になる", () => {
    // 別名解決（findSubstance）が複数エントリ経路でも効くことを固定。
    const byId = evaluateRisk({
      entries: [
        { entryKey: "a", substanceId: "tramadol_combo", dose: 2, route: "oral" },
        { entryKey: "b", substanceId: "moclobemide", dose: 300, route: "oral" },
      ],
    });
    const byAlias = evaluateRisk({
      entries: [
        { entryKey: "a", substanceId: "トラムセット", dose: 2, route: "oral" }, // tramadol_combo alias
        { entryKey: "b", substanceId: "aurorix", dose: 300, route: "oral" }, // moclobemide alias
      ],
    });
    expect(byId.ok && byAlias.ok).toBe(true);
    if (!byId.ok || !byAlias.ok) return;
    expect(byAlias.result).toEqual(byId.result);
  });
});

// -----------------------------------------------------------------------------
// エイリアス解決の calculateRisk 層ゴールデン（下位層の直接固定）。
//
// Task5A 修正後は validation が findSubstance で別名解決するため、evaluateRisk 層でも
// 別名が受理される（success 側「別名〜同一の評価結果」で固定済み）。ここは下位層の
// calculateRisk が findSubstance による別名 → 物質解決を行うことを直接固定する。
// -----------------------------------------------------------------------------
describe("calculateRisk — golden (alias resolution)", () => {
  // 別名入力は正式名称入力と完全に同一の RiskResult を返す。
  const canonical = calculateRisk("methylphenidate", "30", "oral");

  it("正式 id と商品名/日本語名/一般名の別名は同一の評価結果になる", () => {
    const canonicalExpected: RiskResult = {
      finalScore: 8,
      breakdown: { base: 8, routeFactor: 1, doseFactor: 1, interactionAdd: 0 },
      firedInteractions: [],
      warnings: [],
      tags: MPH_TAGS,
      sources: [],
    };
    // まず正式 id の結果自体をゴールデン固定。
    expect(canonical).toEqual(canonicalExpected);

    // 各別名が正式名称と同一結果になること。
    expect(calculateRisk("リタリン", "30", "oral")).toEqual(canonical); // 日本語商品名
    expect(calculateRisk("ritalin", "30", "oral")).toEqual(canonical); // 英語商品名
    expect(calculateRisk("mph", "30", "oral")).toEqual(canonical); // 略号
    expect(calculateRisk("Methylphenidate", "30", "oral")).toEqual(canonical); // 一般名
  });
});

// -----------------------------------------------------------------------------
// calculateCombinedRisk（複数薬剤合成）層の相互作用ゴールデン（下位層の直接固定）。
// evaluateRisk 層の同ケースは上の「evaluateRisk — golden (interaction)」で固定済み。
//
// 使用ペア: tramadol_combo + moclobemide
//   → maoi_plus_serotonergic ルールが発火（moclobemide + serotonergic×2）。
//   （課題例の "tramadol + moclobemide" に対応。単剤トラマドールは未実装のため
//     配合剤 tramadol_combo を使用。）
// -----------------------------------------------------------------------------
describe("calculateCombinedRisk — golden (interaction)", () => {
  it("モクロベミドとセロトニン作動薬の併用で MAOI 相互作用が加算される", () => {
    const res = calculateCombinedRisk([
      { drug: "tramadol_combo", dose: "2", route: "oral" },
      { drug: "moclobemide", dose: "300", route: "oral" },
    ]);

    // soloTotal = 7(tramadol_combo) + 2(moclobemide) = 9
    // interactionAdd = 10（maoi_plus_serotonergic）
    // finalScore = round(9 + 10) = 19
    expect(res).toEqual({
      finalScore: 19,
      soloTotal: 9,
      interactionAdd: 10,
      perDose: [
        { drug: "tramadol_combo", soloScore: 7 },
        { drug: "moclobemide", soloScore: 2 },
      ],
      triggered: [
        {
          ruleId: "maoi_plus_serotonergic",
          severity: "high",
          contribution: 10,
        },
      ],
      // 【Task5A で構造変更】CombinedRiskResult に sources を追加（引用元の伝播用）。
      //   発火ルールに sources 未定義のため現状 []（詳細はサマリー参照）。
      sources: [],
    });

    // 相互作用が実際に発火し、加算に寄与していること。
    expect(res.triggered).toHaveLength(1);
    expect(res.interactionAdd).toBeGreaterThan(0);
    expect(res.triggered[0]).toMatchObject({
      ruleId: "maoi_plus_serotonergic",
      contribution: res.interactionAdd,
    });
  });
});

describe("evaluateRisk — golden (validation)", () => {
  it("存在しない物質名は substanceId フィールドのエラーになる", () => {
    const res = evaluateRisk(input({ substanceId: "no_such_drug" }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.errors).toEqual([
      {
        entryKey: "k1",
        field: "substanceId",
        message: "登録されていない物質です",
      },
    ]);
    // エラー対象フィールドが正しく、message が空でないこと。
    const err = res.errors.find((e) => e.field === "substanceId");
    expect(err).toBeDefined();
    expect(err!.field).toBe("substanceId");
    expect(err!.message.length).toBeGreaterThan(0);
  });

  it("負の用量は dose フィールドのエラーになる", () => {
    const res = evaluateRisk(input({ dose: -5 }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.errors).toMatchObject([
      { entryKey: "k1", field: "dose" },
    ]);
    const err = res.errors.find((e) => e.field === "dose");
    expect(err).toBeDefined();
    expect(err!.field).toBe("dose");
    expect(err!.message.length).toBeGreaterThan(0);
  });

  it("用量 0 は dose フィールドのエラーになる", () => {
    const res = evaluateRisk(input({ dose: 0 }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    const err = res.errors.find((e) => e.field === "dose");
    expect(err).toBeDefined();
    expect(err!.field).toBe("dose");
    expect(err!.message.length).toBeGreaterThan(0);
  });

  it("その物質で許可されない投与経路は route フィールドのエラーになる", () => {
    // moclobemide の routes は oral のみ。nasal は不許可。
    const res = evaluateRisk(input({ substanceId: "moclobemide", route: "nasal" }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.errors).toEqual([
      {
        entryKey: "k1",
        field: "route",
        message: "この物質では選べない投与経路です",
      },
    ]);
    const err = res.errors.find((e) => e.field === "route");
    expect(err).toBeDefined();
    expect(err!.field).toBe("route");
    expect(err!.message.length).toBeGreaterThan(0);
  });

  it("id・別名のいずれにも一致しない文字列は substanceId エラーになる", () => {
    // 【Task5A 修正で挙動変更】別名（例: リタリン）は受理されるようになったため、
    // 旧「別名は拒否」テストは success 側の別名同一性ゴールデンへ置き換えた。
    // ここでは id にも別名にも一致しない文字列が従来どおり拒否されることを固定する。
    const res = evaluateRisk(input({ substanceId: "not-a-real-alias" }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.errors).toEqual([
      {
        entryKey: "k1",
        field: "substanceId",
        message: "登録されていない物質です",
      },
    ]);
  });

  it("FieldError は field と message を必ず持つ", () => {
    const res = evaluateRisk(input({ substanceId: "no_such_drug", dose: -1 }));
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.errors.length).toBeGreaterThan(0);
    for (const e of res.errors) {
      expect(typeof e.field).toBe("string");
      expect(e.field.length).toBeGreaterThan(0);
      expect(typeof e.message).toBe("string");
      expect(e.message.length).toBeGreaterThan(0);
    }
  });
});
