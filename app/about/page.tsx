type SourceRef = {
  id: string
  title: string
  url?: string
  note?: string
}

export default function AboutPage() {
  const sources: SourceRef[] = []

  return (
    <main style={{ padding: 20 }}>
      <h1>About / References</h1>

      <p>
        このアプリのリスク評価は、以下の文献・資料に基づいています。
      </p>

      {sources.length === 0 ? (
        <p>現在参照資料は未登録</p>
      ) : (
        <ul>
          {sources.map((s) => (
            <li key={s.id} style={{ marginBottom: 12 }}>
              <strong>{s.title}</strong>
              {s.url && (
                <>
                  {' '}
                  - <a href={s.url} target="_blank">{s.url}</a>
                </>
              )}
              {s.note && <div style={{ fontSize: 12 }}>{s.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
