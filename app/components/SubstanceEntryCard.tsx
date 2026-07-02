import type { Route, Substance } from '@/src/types/domain'
import type { FieldError } from '@/src/lib/validation'

type Props = {
  substance: Substance
  dose: number
  route: string
  // このエントリのバリデーションエラー（表示のみ・判定は page.tsx 経由の evaluateRisk）。
  errors?: FieldError[]
  onChange: (patch: { dose?: number; route?: string }) => void
  onRemove: () => void
}

function FieldErrors({ errors }: { errors: FieldError[] }) {
  if (errors.length === 0) return null
  return (
    <div className="mt-1 space-y-0.5">
      {errors.map((e, i) => (
        <p key={i} className="text-sm text-red-600">
          {e.message}
        </p>
      ))}
    </div>
  )
}

export default function SubstanceEntryCard({
  substance,
  dose,
  route,
  errors = [],
  onChange,
  onRemove,
}: Props) {
  const routes: Route[] = substance.routes ?? ['oral']
  const doseErrors = errors.filter((e) => e.field === 'dose')
  const routeErrors = errors.filter((e) => e.field === 'route')

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{substance.displayName}</div>
          {substance.aliases && substance.aliases.length > 0 && (
            <div className="text-xs text-gray-500">{substance.aliases.join(' / ')}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[44px] rounded border px-3 text-sm text-red-700"
        >
          削除
        </button>
      </div>

      <div className="flex gap-2">
        <label className="flex-1 text-xs text-gray-500">
          用量{substance.defaultUnit ? `（${substance.defaultUnit}）` : ''}
          <input
            type="text"
            inputMode="decimal"
            value={Number.isNaN(dose) ? '' : String(dose)}
            onChange={(e) => {
              const raw = e.target.value.trim()
              onChange({ dose: raw === '' ? 0 : Number(raw) })
            }}
            className="mt-1 h-11 w-full rounded border px-2 text-base"
          />
          <FieldErrors errors={doseErrors} />
        </label>

        <label className="flex-1 text-xs text-gray-500">
          経路
          <select
            value={route}
            onChange={(e) => onChange({ route: e.target.value })}
            className="mt-1 h-11 w-full rounded border px-2 text-base"
          >
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <FieldErrors errors={routeErrors} />
        </label>
      </div>
    </div>
  )
}
