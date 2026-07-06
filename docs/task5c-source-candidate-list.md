# Source Candidate List

> ステータス: 収集計画（Task5C・一次資料収集フェーズ）
> 作成日: 2026-07-04
> 目的: 人間（Gin）が PMDA 等から一次資料を効率よく収集するための **対象候補の整理**。
> 本ドキュメントは docs のみ。コード / テスト / `interactionRules` / `SourceRef` は変更していない。
> 関連: [task5c-source-plan.md](./task5c-source-plan.md)（棚卸し）、[task5c-source-guideline.md](./task5c-source-guideline.md)（採用基準）、[task5c-implementation-plan.md](./task5c-implementation-plan.md)（実装方針）

## 読み方・前提

- **AI は採用判断を行わない。** 本リストは「どの薬剤の、どの資料を、どの Rule のために探せばよいか」の **収集対象候補** のみ。実在確認・内容一致・採用可否はすべて Gin がガイドライン §2 で判断する。
- **資料（薬剤）ごと** に整理している（Rule ごとではない）。1 資料が複数 Rule を裏づけるため、薬剤単位で集める方が効率的。
- 「優先資料」は上ほど優先度が高い（Tier 1 → 補助の順）。全部を集める必要はなく、ガイドライン §4 の severity 別最低要件を満たせばよい。
- 「確認できそうな記載箇所」は探索の当たりを示すヒント。**その記載が実際に主張を支持するかは Gin が確認**（要一次確認）。

## 対象薬剤 × Rule 早見表

`interactionRules`（4 件）と `substances.ts`（5 件）を突き合わせた結果。✓ はその薬剤が当該 Rule の発火条件に関与することを示す。

| 薬剤（一般名） | R1 MAOI×セロトニン | R2 中枢抑制の重複 | R3 オピオイド×睡眠薬様 | R4 けいれん閾値×刺激系 |
|---|:---:|:---:|:---:|:---:|
| Tramadol 配合剤 | ✓（serotonergic） | ✓（depressant） | ✓（opioid_like） | ✓（seizure_threshold） |
| Moclobemide | ✓（substance + serotonergic） | | | |
| Pregabalin | | ✓（depressant） | ✓（sedative_hypnotic） | |
| Eszopiclone | | ✓（depressant） | ✓（sedative_hypnotic） | |
| Methylphenidate | | | | ✓（stimulant） |

- **Tramadol 配合剤は全 4 Rule に関与するハブ薬剤**。最優先で厚く収集する。
- R1 は実質「Moclobemide + Tramadol 配合剤」の 2 剤が揃ったときのみ発火（serotonergic 保有は現データでこの 2 剤のみ）。

---

## Substance: Tramadol/Acetaminophen 配合剤（トラムセット）

- 一般名: Tramadol + Acetaminophen（配合剤 / `tramadol_combo`）
- 販売名: トラムセット配合錠（Tramcet）
- 保有タグ: opioid_like / respiratory_depression / serotonergic / seizure_threshold_lowering / depressant
- 補足: 本アプリの対象は **配合剤のみ**。単剤トラマドール（トラマール／ワントラム等）は別実体で現状未対応。ただし相互作用の機序資料としては単剤トラマドールの添付文書・IF も参考になり得る（採用時は対象製剤の一致を Gin が確認）。

優先資料
1. PMDA 電子添文（トラムセット配合錠）— 併用禁忌／併用注意、警告、重大な副作用
2. インタビューフォーム（トラムセット）— 薬物動態、セロトニン作動性・μ 作動性の薬理
3. PMDA 安全性情報 / 使用上の注意改訂指示（トラマドール関連）
4. 審査報告書（トラムセット）
5. FDA label / boxed warning（tramadol、opioid × ベンゾ／CNS 抑制薬）— 海外当局の警告根拠（要一次確認）
6. 学会ガイドライン（日本ペインクリニック学会等）— セロトニン症候群・けいれん・呼吸抑制（必要時）

確認できそうな記載箇所（当たり）
- MAO 阻害薬・セロトニン作動薬との併用注意（→ R1）
- 中枢神経抑制薬／アルコールとの併用注意、呼吸抑制（→ R2・R3）
- けいれん・けいれん閾値低下の警告（→ R4）

この資料から確認できそうな Rule
- maoi_plus_serotonergic（R1、serotonergic 側）
- depressant_stacking（R2）
- opioid_plus_sedative_hypnotic（R3、opioid_like 側）
- seizure_threshold_with_stimulant（R4、seizure_threshold_lowering 側）

---

## Substance: Moclobemide（国内販売名なし）

- 一般名: Moclobemide（`moclobemide`、RIMA＝可逆的 MAO-A 阻害薬）
- 販売名: **日本では未承認／未販売**（該当する国内販売名なし）。海外: Aurorix、Manerix
- 保有タグ: serotonergic
- ⚠️ **収集効率上の重要注意**: 国内未承認のため **PMDA 電子添文・国内 IF・審査報告書は存在しない見込み**。PMDA を探しても徒労になるため、下記のとおり **海外当局ラベル + セロトニン症候群の機序資料** に優先度を振り替える。

優先資料
1. 海外規制当局ラベル（Swissmedic / TGA Australia / EU 各国の Moclobemide SmPC）— MAOI × セロトニン作動薬の禁忌・警告（要一次確認）
2. セロトニン症候群の学会ガイドライン / 公的資料（診断・機序・原因薬）
3. システマティックレビュー / メタ解析・査読総説（RIMA とセロトニン作動薬の相互作用、セロトニン症候群）
4. 標準教科書（グッドマン・ギルマン等）— MAO 阻害と併用リスクの機序（版・ページ特定）

確認できそうな記載箇所（当たり）
- MAO 阻害薬とセロトニン作動薬（トラマドール等）併用の禁忌／警告
- セロトニン症候群の発症機序（併用による過剰セロトニン作動）

この資料から確認できそうな Rule
- maoi_plus_serotonergic（R1、substance = moclobemide の中核根拠）

---

## Substance: Pregabalin（リリカ）

- 一般名: Pregabalin（`pregabalin`）
- 販売名: リリカ（Lyrica）、および後発品（プレガバリン「各社」）
- 保有タグ: depressant / sedative_hypnotic

優先資料
1. PMDA 電子添文（リリカ）— 中枢神経抑制薬・アルコール・オピオイドとの併用注意、傾眠・呼吸抑制
2. インタビューフォーム（リリカ）— 中枢抑制の薬理、薬物動態
3. PMDA 安全性情報 / 使用上の注意改訂指示（プレガバリン、呼吸抑制関連の改訂があれば）
4. 審査報告書（リリカ）
5. 査読論文 / 学会ガイドライン — ガバペンチノイド + オピオイド／CNS 抑制薬の相加作用（必要時）

確認できそうな記載箇所（当たり）
- 中枢神経抑制薬・アルコールとの併用注意、傾眠・めまい（→ R2）
- オピオイド系鎮痛薬との併用による呼吸抑制の注意（→ R3）

この資料から確認できそうな Rule
- depressant_stacking（R2、depressant 側）
- opioid_plus_sedative_hypnotic（R3、sedative_hypnotic 側）

---

## Substance: Eszopiclone（ルネスタ）

- 一般名: Eszopiclone（`eszopiclone`）
- 販売名: ルネスタ（Lunesta）
- 保有タグ: depressant / sedative_hypnotic / respiratory_depression

優先資料
1. PMDA 電子添文（ルネスタ）— 中枢神経抑制薬・アルコール・オピオイドとの併用注意、呼吸抑制
2. インタビューフォーム（ルネスタ）— 鎮静・催眠の薬理、薬物動態
3. PMDA 安全性情報 / 使用上の注意改訂指示（エスゾピクロン、呼吸抑制・過鎮静関連）
4. 審査報告書（ルネスタ）
5. FDA label（eszopiclone、CNS 抑制薬併用の警告）— 海外当局の補助根拠（必要時）

確認できそうな記載箇所（当たり）
- 中枢神経抑制薬・アルコールとの併用注意、過鎮静（→ R2）
- オピオイド系との併用による呼吸抑制の注意（→ R3）

この資料から確認できそうな Rule
- depressant_stacking（R2、depressant 側）
- opioid_plus_sedative_hypnotic（R3、sedative_hypnotic 側）

---

## Substance: Methylphenidate（リタリン・コンサータ）

- 一般名: Methylphenidate（`methylphenidate`）
- 販売名: リタリン（Ritalin）、コンサータ（Concerta、OROS 徐放）
- 保有タグ: stimulant / heart_rate_up / blood_pressure_up / arrhythmia_risk
- 補足: 流通管理（第一種向精神薬・登録制）下の薬剤。添付文書の入手は PMDA から可能。

優先資料
1. PMDA 電子添文（コンサータ / リタリン）— けいれんの既往・閾値低下に関する警告、精神神経系副作用
2. インタビューフォーム（コンサータ / リタリン）— 中枢刺激の薬理、薬物動態
3. PMDA 安全性情報 / 使用上の注意改訂指示（メチルフェニデート、けいれん関連）
4. 審査報告書（コンサータ）
5. 査読論文 / 症例報告 — 刺激薬とけいれん閾値低下物質併用のけいれん誘発（必要時）

確認できそうな記載箇所（当たり）
- けいれん・てんかんの既往への注意、けいれん閾値低下薬との併用（→ R4）

この資料から確認できそうな Rule
- seizure_threshold_with_stimulant（R4、stimulant 側）

---

## 収集の進め方（効率メモ）

- **優先順**: ハブの Tramadol 配合剤 → Moclobemide（海外資料）→ Pregabalin / Eszopiclone → Methylphenidate。high 系（R1・R3）に関与する薬剤から着手するとガイドライン §4 の最低要件を早く満たせる。
- **1 資料で複数 Rule をカバー**: Tramadol 配合剤の電子添文 1 本で R1〜R4 の該当欄を横断確認できる。まず電子添文を通読してから不足を IF・論文で補うと重複探索を避けられる。
- **Moclobemide は PMDA を探さない**（未承認）。最初から海外ラベル + セロトニン症候群の機序資料に向かう。
- **記録**: 開いた資料は URL/版/参照日/該当セクションを控える（ガイドライン §2-4）。却下したものは理由を軽く残す（§5-7）。
- 集めた資料の採用可否・SourceRef 化（sources.ts への登録、`src()` 参照）は本フェーズの範囲外。実装方針は [task5c-implementation-plan.md](./task5c-implementation-plan.md) を参照。
