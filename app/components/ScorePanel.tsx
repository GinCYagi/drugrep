import type { RiskTag } from '@/src/types/domain'

type Props = {
  // 入力が無効なとき（null）はスコアを非表示（グレーアウト）にする。
  finalScore: number | null
  tags: RiskTag[]
}

// 0-33 低 / 34-66 中 / 67-100 高。色は Tailwind の green/amber/red 系。
function level(score: number) {
  if (score <= 33) return { label: '低', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' }
  if (score <= 66) return { label: '中', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' }
  return { label: '高', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' }
}

export default function ScorePanel({ finalScore, tags }: Props) {
  const l = finalScore === null ? null : level(finalScore)
  const width = finalScore === null ? 0 : Math.max(0, Math.min(100, finalScore))
  const barColor = l ? l.bar : 'bg-gray-300'

  return (
    <section className="sticky top-0 z-10 border-b bg-white p-4">
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-[40px] font-bold leading-none ${
              finalScore === null ? 'text-gray-300' : ''
            }`}
          >
            {finalScore === null ? '—' : finalScore}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
        {l && (
          <span className={`rounded px-2 py-1 text-sm font-medium ${l.badge}`}>
            リスク {l.label}
          </span>
        )}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-200">
        <div className={`h-full ${barColor}`} style={{ width: `${width}%` }} />
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {t}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
