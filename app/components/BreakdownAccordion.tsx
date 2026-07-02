import type { RiskResult } from '@/src/types/domain'

type Props = {
  breakdown: RiskResult['breakdown']
}

export default function BreakdownAccordion({ breakdown }: Props) {
  const rows: [string, number][] = [
    ['base', breakdown.base],
    ['routeFactor', breakdown.routeFactor],
    ['doseFactor', breakdown.doseFactor],
    ['interactionAdd', breakdown.interactionAdd],
  ]

  return (
    <details className="rounded border text-sm">
      <summary className="cursor-pointer px-3 py-2 text-gray-700">内訳</summary>
      <dl className="divide-y border-t">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-1.5">
            <dt className="text-gray-500">{k}</dt>
            <dd className="font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
