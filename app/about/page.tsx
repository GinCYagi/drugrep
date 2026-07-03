import Link from 'next/link'

type SourceRef = {
  id: string
  title: string
  url?: string
  note?: string
}

export default function AboutPage() {
  // 出典データの取得元（既存の SourceRef 配列ベース）を維持。
  // NOTE: コードベースに aggregateSources / SourceRef.kind は未実装のため、
  //   現状は空配列＝未登録表示。将来 kind 別グルーピングを行う場合は
  //   src/lib 側に集約関数を用意する前提（本タスクではロジック変更禁止のため未着手）。
  const sources: SourceRef[] = []

  return (
    <main className="mx-auto max-w-md space-y-6 p-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-lg font-medium">drugrep</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          ← 戻る
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">このアプリについて</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          drugrepはハームリダクション(害の低減)を目的とした情報提供ツールです。
          薬物使用を推奨するものではなく、使用する場合のリスクを可視化することで、
          より安全な判断を支援することを目的としています。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">算出方法</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          スコアは 0〜100 で、物質ごとの基礎リスク・投与経路・用量から算出し、
          物質間の相互作用がある場合は加算されます。
        </p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
          <code>finalScore = clamp((base × route × dose) + interaction, 0, 100)</code>
        </pre>
        <p className="text-sm leading-relaxed text-gray-700">
          スコアは
          <strong>低リスク(0〜33)</strong>・<strong>中リスク(34〜66)</strong>・
          <strong>高リスク(67〜100)</strong>
          の3段階に区分して色分け表示します。
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          各係数の根拠は下記の出典一覧を参照してください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">限界と制限事項</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-700">
          <li>本ツールは情報提供のみを目的とし、医療上の助言ではありません</li>
          <li>
            スコアは登録済みルールに基づく相対的な目安であり、絶対的な安全度ではありません
          </li>
          <li>スコアが低いことは安全を意味しません</li>
          <li>
            評価対象は登録済みの物質のみです（未登録の物質は評価されません）
          </li>
          <li>
            相互作用は登録済みの組み合わせのみを評価します（未登録の相互作用は検出されません）
          </li>
          <li>個人差(体重、耐性、代謝、併用薬、健康状態)は反映されません</li>
          <li>情報は出典時点のものであり、最新の知見と異なる場合があります</li>
          <li>
            意識障害・けいれん・呼吸困難などの緊急時はためらわず119へ
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">出典一覧</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-gray-500">現在参照資料は未登録</p>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => (
              <li key={s.id} className="text-sm">
                <strong className="font-medium">{s.title}</strong>
                {s.url && (
                  <>
                    {' - '}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {s.url}
                    </a>
                  </>
                )}
                {s.note && <div className="text-xs text-gray-500">{s.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">緊急時</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          意識障害、けいれん、呼吸困難などがある場合はためらわず119へ。
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          中毒に関する相談: 大阪中毒110番(072-727-2499、24時間・情報提供料あり)
        </p>
      </section>
    </main>
  )
}
