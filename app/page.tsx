'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { calculateCombinedRisk } from '@/src/lib/rules/calculate-risk'
import { evaluateRisk } from '@/src/lib/evaluate'
import { substances } from '@/src/lib/substances'
import { interactionRules } from '@/src/lib/rules/interaction-rules'
import type { RiskTag } from '@/src/types/domain'
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

  const addSubstance = (substanceId: string) => {
    const s = substanceById.get(substanceId)
    if (!s) return
    setEntries((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        substanceId,
        // 典型量フィールドは物質データに無いため 0、経路は routes[0]。
        dose: 0,
        route: s.routes?.[0] ?? 'oral',
      },
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

  // ScorePanel 用 tags（有効エントリの和集合）。
  const tags = useMemo(() => {
    const set = new Set<RiskTag>()
    for (const p of perEntry) if (p.ev.ok) for (const t of p.ev.result.tags) set.add(t)
    return [...set]
  }, [perEntry])

  // WarningBanner 用（有効エントリの warnings を物質名前置で結合）。
  const warnings = useMemo(() => {
    const out: string[] = []
    for (const p of perEntry) {
      if (!p.ev.ok) continue
      const name = p.substance?.displayName ?? p.entry.substanceId
      for (const w of p.ev.result.warnings) out.push(`${name}: ${w}`)
    }
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
        finalScore={allValid ? (combined?.finalScore ?? 0) : null}
        tags={tags}
      />

      <div className="flex-1 space-y-4 p-4">
        <WarningBanner warnings={warnings} />
        <InteractionList interactions={interactions} />

        <SubstanceCombobox substances={substances} onAdd={addSubstance} />

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
