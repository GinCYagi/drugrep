'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  calculateCombinedRisk,
  outOfModelRangeReason,
} from '@/src/lib/rules/calculate-risk'
import { evaluateRisk } from '@/src/lib/evaluate'
import { substances } from '@/src/lib/substances'
import { interactionRules } from '@/src/lib/rules/interaction-rules'
import type { RiskTag, ScoreSuppressionReason } from '@/src/types/domain'
import { ja } from '@/src/lib/i18n/ja'
import ScorePanel from './components/ScorePanel'
import WarningBanner from './components/WarningBanner'
import InteractionList from './components/InteractionList'
import SubstanceEntryCard from './components/SubstanceEntryCard'
import SubstanceCombobox from './components/SubstanceCombobox'
import BreakdownAccordion from './components/BreakdownAccordion'

type Entry = { key: string; substanceId: string; dose: number; route: string }

// 表示整形用のルックアップ（データ参照のみ・ロジックなし）。
const substanceById = new Map(substances.map((s) => [s.id, s]))
const ruleLabelById = new Map(interactionRules.map((r) => [r.id, r.label]))

export default function Home() {
  // 唯一の所有状態。
  const [entries, setEntries] = useState<Entry[]>([])
  // 同一物質の重複追加を弾いた際の軽い通知（表示のみ）。
  const [notice, setNotice] = useState<string | null>(null)

  const addSubstance = (substanceId: string) => {
    const s = substanceById.get(substanceId)
    if (!s) return
    // MVP: 同一物質の複数カード追加は禁止（時間差・分割摂取評価は Post-MVP）。
    // 内部ロジック（calculateCombinedRisk）は複数 entry を扱えるが、UI では露出させない。
    if (entries.some((e) => e.substanceId === substanceId)) {
      setNotice(ja.entry.duplicateNotice)
      return
    }
    setNotice(null)
    // 新規カードは先頭に追加（追加操作の近くに出し、未入力エラーが最下段に隠れないように）。
    setEntries((prev) => [
      {
        key: crypto.randomUUID(),
        substanceId,
        // 典型量フィールドは物質データに無いため 0、経路は routes[0]。
        dose: 0,
        route: s.routes?.[0] ?? 'oral',
      },
      ...prev,
    ])
  }

  const updateEntry = (
    key: string,
    patch: { dose?: number; route?: string },
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e)),
    )
  }

  const removeEntry = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.key !== key))
  }

  // 集計トップライン（物質間相互作用込み）: calculateCombinedRisk。
  const combined = useMemo(() => {
    if (entries.length === 0) return null
    return calculateCombinedRisk(
      entries.map((e) => ({
        drug: e.substanceId,
        dose: String(e.dose),
        route: e.route,
      })),
    )
  }, [entries])

  // 各エントリを evaluateRisk（検証 → 成功時のみ単剤 calculateRisk）に通す。
  // UI はカード単位で entries 1件ずつ渡す。
  const perEntry = useMemo(
    () =>
      entries.map((e) => ({
        entry: e,
        substance: substanceById.get(e.substanceId),
        ev: evaluateRisk({
          entries: [
            {
              entryKey: e.key,
              substanceId: e.substanceId,
              dose: e.dose,
              route: e.route,
            },
          ],
        }),
      })),
    [entries],
  )

  // 全エントリが検証OKのときだけ集計スコア/相互作用を表示する。
  const allValid = perEntry.every((p) => p.ev.ok)

  // スコア表示を抑制する理由コード（構造化）をロジック層から集める。UI は生の dose 比較を
  // 持たず、判定の正典は calculate-risk の outOfModelRangeReason に一本化する（表示層依存を排除）。
  // 現状の理由は "dose_out_of_model_range" のみだが、将来 reason を増やせる形にしてある。
  const suppressionReasons = useMemo<ScoreSuppressionReason[]>(
    () =>
      entries.flatMap((e) => {
        const s = substanceById.get(e.substanceId)
        if (!s) return []
        const reason = outOfModelRangeReason(s, e.dose)
        return reason ? [reason] : []
      }),
    [entries],
  )

  // 適用範囲外エントリの表示名（理由文で「どの物質が範囲外か」を明示するため）。
  const outOfRangeNames = useMemo(
    () =>
      entries.flatMap((e) => {
        const s = substanceById.get(e.substanceId)
        return s && outOfModelRangeReason(s, e.dose) ? [s.displayName] : []
      }),
    [entries],
  )

  // モデル適用範囲外の検出。数値スコアは出さず「適用範囲外」表示にし、タグ・相互作用・
  // 警告・119導線などの判断材料は継続表示する（評価停止しない）。
  //
  // 【裁定 2026-07-07（Gin 承認）】複数薬入力で1エントリでも抑制理由があれば、集計スコア
  // 「全体」を非表示にする。理由: 構成要素が1つでもモデル適用範囲外なら、その solo は
  // doseFactor 2.0（外挿域）で計算され、合算値 finalScore を数値として信頼できない。部分的に
  // 数値を出すと「範囲外を含む合算」を有効スコアと誤読させるため、トップラインは一括で
  // 「適用範囲外」に倒す（各エントリの判断材料＝タグ・警告・相互作用は継続表示）。
  // 注記: 抑制は本 UI 層の責務。ロジック層（calculateCombinedRisk）は範囲外でも合算値を返す
  //       （golden: "calculateCombinedRisk — golden (out-of-range, no suppression)" で固定）。
  const outOfModelRange = suppressionReasons.length > 0

  // ScorePanel 用 tags（有効エントリの和集合）。
  const tags = useMemo(() => {
    const set = new Set<RiskTag>()
    for (const p of perEntry) if (p.ev.ok) for (const t of p.ev.result.tags) set.add(t)
    return [...set]
  }, [perEntry])

  // WarningBanner 用（有効エントリの warnings を「物質名 #カード番号」前置で結合）。
  // どのカードの警告かを一覧側で識別できるようにする（#1 対応）。
  const warnings = useMemo(() => {
    const out: string[] = []
    perEntry.forEach((p, i) => {
      if (!p.ev.ok) return
      const name = p.substance?.displayName ?? p.entry.substanceId
      for (const w of p.ev.result.warnings) out.push(`${name} #${i + 1}: ${w}`)
    })
    return out
  }, [perEntry])

  // InteractionList 用（triggered を label 付きに整形）。集計は calculateCombinedRisk の責務。
  const interactions = useMemo(() => {
    if (!combined || !allValid) return []
    return combined.triggered.map((t) => ({
      ruleId: t.ruleId,
      label: ruleLabelById.get(t.ruleId) ?? t.ruleId,
      contribution: t.contribution,
      severity: t.severity,
    }))
  }, [combined, allValid])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-bold">{ja.app.title}</span>
        <Link href="/about" className="text-sm text-blue-600 underline">
          {ja.app.aboutLink}
        </Link>
      </header>

      <ScorePanel
        finalScore={allValid && !outOfModelRange ? (combined?.finalScore ?? 0) : null}
        outOfRange={allValid && outOfModelRange}
        tags={tags}
      />

      {/* 適用範囲外でスコアを非表示にした理由を必ず明示する（どの物質が範囲外かを示す）。
          スコアだけ非表示で、タグ・警告・相互作用・救急導線は下部で継続表示する。 */}
      {allValid && outOfModelRange && outOfRangeNames.length > 0 && (
        <p className="border-b bg-amber-50 px-4 py-2 text-xs leading-snug text-amber-800">
          {outOfRangeNames.join('・')}
          {ja.score.outOfRangeReasonSuffix}
        </p>
      )}

      <div className="flex-1 space-y-4 p-4">
        <p className="rounded bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          {ja.disclaimer.short}{' '}
          <Link href="/about" className="text-blue-600 underline">
            {ja.disclaimer.detailLink}
          </Link>
        </p>

        <WarningBanner warnings={warnings} />
        <InteractionList interactions={interactions} />

        <SubstanceCombobox substances={substances} onAdd={addSubstance} />
        {notice && <p className="text-xs text-amber-700">{notice}</p>}

        {entries.length === 0 && (
          <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700">{ja.empty.title}</p>
            <p className="mt-1">{ja.empty.body}</p>
          </div>
        )}

        <div className="space-y-4">
          {perEntry.map((p) =>
            p.substance ? (
              <div key={p.entry.key} className="space-y-2">
                <SubstanceEntryCard
                  substance={p.substance}
                  dose={p.entry.dose}
                  route={p.entry.route}
                  errors={p.ev.ok ? [] : p.ev.errors}
                  onChange={(patch) => updateEntry(p.entry.key, patch)}
                  onRemove={() => removeEntry(p.entry.key)}
                />
                {p.ev.ok && <BreakdownAccordion breakdown={p.ev.result.breakdown} />}
              </div>
            ) : null,
          )}
        </div>
      </div>

      <footer className="space-y-1 border-t p-4 text-xs text-gray-500">
        <p>{ja.footer.disclaimer}</p>
        <Link href="/about" className="text-blue-600 underline">
          {ja.footer.aboutLink}
        </Link>
      </footer>
    </main>
  )
}
