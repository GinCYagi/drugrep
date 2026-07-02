import type { InteractionSeverity } from '@/src/types/domain'

// page.tsx が triggered(TriggeredRule) を label 付きに整形して渡す前提の表示用型。
type InteractionItem = {
  ruleId: string
  label: string
  contribution: number
  severity: InteractionSeverity
}

type Props = {
  interactions: InteractionItem[]
}

export default function InteractionList({ interactions }: Props) {
  if (interactions.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700">相互作用</h2>
      <ul className="space-y-1">
        {interactions.map((it) => (
          <li
            key={it.ruleId}
            className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
          >
            <span>{it.label}</span>
            <span className="font-mono text-amber-800">+{it.contribution}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
