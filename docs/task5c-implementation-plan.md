# Task5C SourceRef 実装方針レビュー

> ステータス: 設計レビュー（実装前）
> 作成日: 2026-07-04
> 対象: `SourceRef` の実装方針（データモデル・カタログ責務・命名・追加フロー・保守性）
> 制約: 本レビューは **docs のみ**。コード / テスト / `interactionRules` の変更、`SourceRef` の追加は行っていない。
> 関連: [task5c-source-plan.md](./task5c-source-plan.md)（棚卸し計画）、[task5c-source-guideline.md](./task5c-source-guideline.md)（採用ガイドライン）

---

## 0. レビューの結論（先出し）

現状のコードと 2 つの計画ドキュメントの間に **1 つの重大な前提ズレ** がある。これを解消しないと Task5C の作業範囲が確定しない。

- **ガイドライン（`task5c-source-guideline.md`）は「カタログ方式」を前提にしている。**
  DoD #3「すべての出典が sources.ts カタログ経由（`src()`）で参照」、§5-4「新規出典は必ず sources.ts に追加してから `src(id)` で参照」など、`sources.ts` / `src()` / `aggregateSources()` / `assertRuleSources()` の存在を前提に書かれている。
- **しかし、これらはコードに一切存在しない。** 実測（`src/` 全走査）で確認したのは以下のみ:
  - `SourceRef` 型（`src/types/domain.ts:101`）… `{ id, title, url?, note? }`
  - `InteractionRule.sources?: SourceRef[]`（`domain.ts:131`）… **各ルールに配列を直書きする形状**
  - 伝播配線（`calculate-risk.ts` の `evaluateInteractions` が `rule.sources` を連結 → `RiskResult.sources` / `CombinedRiskResult.sources`）
  - `sources.ts`（カタログ）、`src()`、`aggregateSources()`、`assertRuleSources()` は **いずれも未実装**。
  - `/about`（`app/about/page.tsx`）は `SourceRef` 型を **ローカルに再定義** し、`sources` を **ハードコードの空配列** にしている（lib と非接続）。

**したがって Task5C は「データ整備に集中」できる状態ではない。** `task5c-source-plan.md` §6 の「配線は完成済み → データ整備に集中できる」は **inline 方式に限れば正しい** が、ガイドラインが要求するカタログ方式を採るなら、**先にカタログ基盤（コード）を作る小フェーズが必要** になる。

→ 本レビューの最重要事項は **§1 の「inline か catalog か」の意思決定**。ここが決まれば残りは follow する。推奨は **カタログ方式（型変更なしで実現可能）**。理由は §5。

---

## 1. SourceRef の最終データモデル

### 1-1. 現状の型（変更しない）

```ts
// src/types/domain.ts:101
export type SourceRef = {
  id: string;      // 一意キー
  title: string;   // 出典タイトル
  url?: string;    // 参照 URL（任意）
  note?: string;   // 補足（版・参照箇所など、任意）
};

// domain.ts:131
export type InteractionRule = {
  // ...
  sources?: SourceRef[]; // ルールに直接 SourceRef 配列を持たせる形状
};
```

### 1-2. 論点: inline か catalog か

| 観点 | A: inline（現状の素直な延長） | B: catalog（ガイドライン前提） |
|---|---|---|
| データの持ち方 | 各ルールの `sources` に `SourceRef` を丸ごと直書き | `sources.ts` に正典を 1 箇所定義、ルールは ID 参照 |
| 同一出典の共有 | コピペ（例: トラマドール添付文書を Rule 3/4 で二重管理） | 1 エントリを複数ルールが参照 |
| 更新（版改訂・URL 変更） | 全出現箇所を手修正（drift 温床） | カタログ 1 箇所修正で全反映 |
| 追加コード | ゼロ | `sources.ts` + `src()` + `aggregateSources()` + `assertRuleSources()` |
| ガイドライン DoD #3 との整合 | ✗（要 Post-MVP 降格） | ✓ |
| 型変更の要否 | 不要 | **不要（下記）** |

### 1-3. 推奨: カタログ方式・ただし型は変えない

カタログ方式は **`SourceRef` / `InteractionRule` の型を一切変えずに** 実現できる。鍵は `src()` を「ID を受けてカタログから解決済みの `SourceRef` を返す関数」にすること。

```ts
// ルール側（型は sources?: SourceRef[] のまま）
sources: [
  src("pmda-moclobemide-if"),
  src("pi-tramadol", "併用注意欄"), // 第2引数でルール文脈の note を上書き
]
// src() の返り値は SourceRef なので、既存の型・伝播配線・golden が無改修で通る
```

- **利点**: `domain.ts` も `calculate-risk.ts` の伝播も無変更。追加は「新規ファイル + 純関数」のみで、リファクタリング禁止・MVP 優先の方針と整合。
- `src(id, note?)` の解決規則（提案）: `{ ...catalog[id], note: note ?? catalog[id].note }`。ルール文脈の note を優先、無ければカタログ既定を使う。存在しない ID は **`assertRuleSources()` / テストで検出**（実行時 throw はしない方向を推奨、§4）。

**結論**: 最終データモデルは現行 `SourceRef` を据え置き、**「正典はカタログ、ルールは `src()` 参照」** の運用モデルを上に載せる。型追加・型変更は Task5C では行わない（`kind`/`tier` 追加は §6 で Post-MVP）。

---

## 2. sources.ts の責務

`substances.ts` が「データ専用・ロジック混入禁止」（AGENTS.md）である方針に合わせ、**データとロジックを分離** する。

| ファイル | 責務 | 種別 |
|---|---|---|
| `src/lib/sources.ts` | **出典カタログ（正典データのみ）**。`Record<string, SourceRef>` または配列。URL・title・既定 note・版情報を保持。ロジックを書かない。 | データ |
| `src/lib/rules/source-catalog.ts`（名称は要確定） | `src(id, note?)`（解決）、`aggregateSources(refs)`（dedupe・整列）、`assertRuleSources(rules)`（非空検証）。カタログを参照する **純関数群**。 | ロジック |

- **sources.ts に持たせるもの**: 出典 1 件 = 1 エントリ。ID をキーに `title` / `url?` / `note?`（既定の版・参照日など）。**出典の実在確認・採用判断は人間（Gin）が行い**、AI は候補提示のみ（ガイドライン前提）。
- **sources.ts に持たせないもの**: dedupe・整列・検証・ルールとの突合。これらはロジック側。
- **責務の一元性**: 「新規出典は必ず sources.ts に追加してから参照」を唯一の入口とする（ルールファイルへの `SourceRef` 直書き禁止）。これによりカタログが単一の真実源になる。

> 命名補足: ガイドラインは総称として "sources.ts" / "`src()`" を使っている。実ファイルは上表のように **データ（sources.ts）とロジック（source-catalog.ts）を分ける** ことを推奨するが、`src()` という呼び名は維持する（呼び出し側の可読性）。

---

## 3. ID 命名規則

### 3-1. 原則: ID は「文書」を指す（ルールではない）

ID はルール ID ではなく **出典文書** を一意に指す。これがカタログ再利用（1 文書 → 複数ルール参照）の前提。物質名は **英名/一般名（`moclobemide`）** を使い、日本語表記ゆれを避けて安定キーにする。

### 3-2. 書式

```
<カテゴリ接頭辞>-<物質 or トピック>-<文書種別/限定子>
例: pmda-moclobemide-if / pi-tramadol / fda-opioid-benzo-warning / paper-serotonin-syndrome-review
```

- 小文字 ASCII・ケバブケース。
- 一意性は **カタログがキー付きマップ** であることで担保（重複キー = 上書き/検出可能）。ルール側では担保しない。

### 3-3. カテゴリ接頭辞（要確定事項を 1 つ決着させる）

`task5c-source-plan.md` §3 は 4 分類 + `regulator-` 未確定。ガイドライン §1 は Tier 制でより細かい。**接頭辞は plan の 4 分類を基本に、海外当局を独立させる** ことを推奨:

| 接頭辞 | 対象 | Tier（ガイドライン） |
|---|---|---|
| `pi-` | 添付文書（電子添文・国内） | Tier 1 |
| `if-` | インタビューフォーム | Tier 1 |
| `pmda-` | PMDA / 国内行政（安全性情報・改訂指示・審査報告） | Tier 1 |
| `fda-` | 海外規制当局（FDA label / boxed warning、EMA 等） | Tier 1 |
| `guideline-` | 学会・公的ガイドライン | Tier 1/2 |
| `paper-` | 査読論文（総説・原著・SR/MA） | Tier 1（SR/MA）〜2 |
| `text-` | 標準教科書（版・ページ必須） | Tier 2 |

- **決着提案**: plan §3 で保留していた「FDA boxed warning を PMDA に含めるか `regulator-` を新設するか」は **`fda-` を新設** で確定。海外当局は出所（provenance）が国内 PMDA と異なり、note ではなく接頭辞で判別できた方が保守で有利。
- Tier は接頭辞に **暗黙内包**（`kind`/`tier` フィールドは MVP では追加しない、§6）。
- 接頭辞の集合はこの表を **唯一の正**とし、plan §3 とガイドライン §1 の二重定義を本ドキュメントに寄せる（§5-e）。

---

## 4. SourceRef 追加フロー

「出典を先に確保 → ルールに紐付け」の順序を固定（ガイドライン §5-1、確証バイアス回避）。

```
1. 探索        AI が候補提示（実在確認はしない）
2. 人間検証     Gin がガイドライン §2 チェックリスト全問 Yes を確認（実在/一致/方向/特定可能性/鮮度/独立性/COI/スコープ/カタログ重複）
3. カタログ登録  src/lib/sources.ts に §3 命名規則で 1 エントリ追加（正典）
4. ルール参照    ルールの sources に src("id", "文脈note") を記述（直書き禁止）
5. 機械検証     assertRuleSources() が severity 別の非空要件を検査（テスト経路で赤検出）
6. golden 固定  ok:true ケースで RiskResult.sources / CombinedRiskResult.sources が非空になることを固定
7. 表示確認     /about の aggregateSources() に実データが出ることを目視
```

- severity 別の最低要件はガイドライン §4 に従う（high=Tier1×1 必須・計2 推奨、caution=Tier1×1 or Tier2×2、等）。**「量（非空）は機械、質は人間」** の役割分担を維持。
- 却下した資料は理由付きで軽く記録（ガイドライン §5-7）。

---

## 5. 保守性上、問題になる点

実測で確認した具体的リスク。優先度順。

- **(a) `/about` が lib と非接続・型を二重定義。**
  `app/about/page.tsx:3` が `SourceRef` 型をローカル再定義し、`sources` を `[]` ハードコード。domain.ts の正と drift する。**カタログを作っても `aggregateSources()` を呼ばない限り /about は永遠に空表示**。Task5C で lib → about の配線（`aggregateSources()` 実装 + about からの参照）が必要（＝コード変更）。

- **(b) 伝播が dedupe なしの連結。**
  `evaluateInteractions` は `sources.push(...rule.sources)`（`calculate-risk.ts:108`）で **重複除去しない**（domain.ts:154 コメントも「dedupe 前の連結」と明記）。複数ルールが同一出典を共有すると /about に重複表示。**dedupe は `aggregateSources()` に持たせる前提だが、それが未実装**。カタログ方式にするなら dedupe 実装は必須。

- **(c) inline 方式のコピペ drift。**
  もし §1 の意思決定を inline のまま進めると、トラマドール添付文書が Rule 3/4 に二重管理され、版改訂時に片方だけ直す事故が起きる。**カタログ方式がこの根本原因を消す**（最大の採用理由）。

- **(d) `assertRuleSources()` 不在・README の約束が未履行。**
  README:22「今後実装予定」のまま。無いと **sources 空のルールを無警告で出荷** できる。ガイドライン DoD #4 は「意図的失敗ケースで 1 回実証」まで要求。Task5C で実装が必要（テスト時検証を推奨、実行時 throw は MVP 安定性の観点で慎重に）。

- **(e) カテゴリ分類の二重定義。**
  plan §3（4 分類 + 保留）とガイドライン §1（Tier 制）が別々に接頭辞/信頼度を規定。放置すると ID 接頭辞と note 文言が揺れる。**§3-3 の表を唯一の正**として一本化する。

- **(f) 係数根拠と出典スコープの不整合（コピー vs データ）。**
  `/about` は「各係数の根拠は下記の出典一覧を参照」と表示（`about/page.tsx:51`）するが、`sources` は **interactionRules 由来のみ**。base（tag weight）/ route（`ROUTE_FACTOR`）/ dose（`doseBands`）の係数には SourceRef を持てる場所が **データモデル上存在しない**。この文言は現状「参照先の無い約束」になっており、誤認を生む。Task5C で /about のコピー修正（係数根拠は Post-MVP と明示、または文言緩和）を検討事項として起票する（本レビューは docs のみのため未修正）。

---

## 6. Post-MVP に回すべき項目

MVP（Task5C）では扱わず、`docs/ideas` か保留リストへ落とす:

- **係数レベルの SourceRef フィールド。** base/route/dose の根拠は現データ構造（ルール単位）では綺麗に持てない（ガイドライン §4 末尾・補足も同旨）。MVP は「係数根拠はドキュメント紐付け」で妥協し、per-substance / per-coefficient の出典フィールド追加は Post-MVP。→ §5-f の /about コピー整合とセット。
- **`SourceRef.kind` / `tier` フィールド。** /about の Tier 別グルーピング表示（about/page.tsx コメントが示唆）。MVP は接頭辞で暗黙分類し、明示フィールド化は Post-MVP。
- **`aggregateSources()` の高度化。** MVP は id dedupe + 安定整列で十分。カテゴリ別グルーピング・件数表示は Post-MVP。
- **鮮度の年次レビュー自動化。** Tier1 資料の改訂検知（ガイドライン §5-5）は MVP では手動運用、自動化は後回し。
- **撤回論文チェックの仕組み化。** MVP は採用時の手動確認（ガイドライン §3）で足り、機械化は Post-MVP。
- **クロス AI 監査の運用組み込み。**（ガイドライン §5-6）ツール化は Post-MVP。
- **処方インポート。** 既に [docs/ideas/prescription-import.md](./ideas/prescription-import.md) に分離済み。SourceRef とは独立。

---

## 7. Task5C 着手前に決めるべきこと（Gin 判断事項）

1. **【最重要】inline か catalog か（§1-2）。** 推奨 = catalog（型変更なしで実現、drift 根絶）。これで Task5C に「カタログ基盤フェーズ（sources.ts + src() + aggregateSources() + assertRuleSources() + about 配線）」が入るか否かが確定する。
2. **接頭辞に `fda-` を新設するか（§3-3）。** 推奨 = 新設。plan §3 の保留はこれで決着。
3. **`assertRuleSources()` はテスト時検証のみか、読込時 throw も入れるか（§4/§5-d）。** 推奨 = テスト時のみ先行（MVP 安定性優先）。
4. **/about の「係数の根拠」文言を Task5C で緩和するか（§5-f）。** 推奨 = 緩和 or「係数根拠は Post-MVP」明示。

---

## 8. まとめ

- データモデルは現行 `SourceRef` を据え置き、**カタログ + `src()` 参照** の運用を上に載せる（型変更不要）。
- `sources.ts` は **データ専用カタログ**、解決/dedupe/検証は **rules 層の純関数** に分離（substances.ts の方針を踏襲）。
- ID は **文書単位・英名・接頭辞分類**。`fda-` 新設で plan の保留を決着。
- 追加フローは **出典先取り → 人間検証 → カタログ登録 → `src()` 参照 → 機械検証 → 表示確認**。
- 最大の保守リスクは **/about の非接続・dedupe 未実装・assert 不在・分類二重定義・係数根拠の空約束** の 5 点。うち carrying-over でなくカタログ導入で消えるのは drift（§5-c）。残りは Task5C の実装/文書対応が要る。
- 係数レベル出典・`kind`/`tier` フィールドは Post-MVP。
