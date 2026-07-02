'use client'
import { useState } from 'react'
import type { Substance } from '@/src/types/domain'

type Props = {
  substances: Substance[]
  onAdd: (substanceId: string) => void
}

// 正式名(displayName/genericName)・エイリアス・id すべてに部分一致（大小無視）。
function matches(s: Substance, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return false
  const haystack = [s.displayName, s.genericName ?? '', s.id, ...(s.aliases ?? [])]
  return haystack.some((h) => h.toLowerCase().includes(needle))
}

export default function SubstanceCombobox({ substances, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const filtered = query.trim() ? substances.filter((s) => matches(s, query)) : []

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="物質を検索して追加"
        className="h-11 w-full rounded border px-3 text-base"
      />

      {filtered.length > 0 && (
        <ul className="rounded border">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(s.id)
                  setQuery('')
                }}
                className="flex min-h-[44px] w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium">{s.displayName}</span>
                {s.aliases && s.aliases.length > 0 && (
                  <span className="text-xs text-gray-500">{s.aliases.join(' / ')}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
