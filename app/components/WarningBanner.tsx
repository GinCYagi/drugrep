type Props = {
  warnings: string[]
}

export default function WarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null

  return (
    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <ul className="list-disc space-y-1 pl-5">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  )
}
