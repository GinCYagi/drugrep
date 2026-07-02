import { ja } from '@/src/lib/i18n/ja'

type Props = {
  warnings: string[]
}

export default function WarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null

  return (
    <section className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <h2 className="mb-1 font-semibold">{ja.warnings.heading}</h2>
      <ul className="list-disc space-y-1 pl-5">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </section>
  )
}
