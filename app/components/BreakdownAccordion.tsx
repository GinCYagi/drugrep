import type { RiskResult } from '@/src/types/domain'
import { ja } from '@/src/lib/i18n/ja'

type Props = {
  breakdown: RiskResult['breakdown']
}

export default function BreakdownAccordion({ breakdown }: Props) {
  const rows: [string, number][] = [
    [ja.breakdown.base, breakdown.base],
    [ja.breakdown.routeFactor, breakdown.routeFactor],
    [ja.breakdown.doseFactor, breakdown.doseFactor],
    [ja.breakdown.interactionAdd, breakdown.interactionAdd],
  ]

  return (
    <details className="rounded border text-sm">
      <summary className="cursor-pointer px-3 py-2 text-gray-700">
        {ja.breakdown.heading}
      </summary>
      <dl className="divide-y border-t">
        {rows.map(([label, v]) => (
          <div key={label} className="flex justify-between px-3 py-1.5">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
