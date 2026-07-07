import Link from 'next/link'
import { interactionRules } from '@/src/lib/rules/interaction-rules'
import { aggregateSources } from '@/src/lib/rules/aggregate-sources'
import { scoreBands } from '@/src/lib/rules/score-level'
import type { ScoreLevel } from '@/src/types/domain'

// レベル→表示ラベル。閾値・範囲は score-level.ts（scoreBands）が正典で、
// ここでは low/mid/high にラベルを対応づけるのみ（数値はハードコードしない）。
const RISK_BAND_LABELS: Record<ScoreLevel, string> = {
  low: '低リスク',
  mid: '中リスク',
  high: '高リスク',
}

export default function AboutPage() {
  // 出典一覧は interactionRules が参照する SourceRef を集約して表示する。
  // 複数ルールが同一出典を参照した場合の重複は aggregateSources が id で除去する。
  // 現状は各ルールの sources 未整備のため空（＝「未登録」表示）。実データが
  // 入り次第、コード変更なしでこの一覧に反映される。
  const sources = aggregateSources(
    interactionRules.flatMap((r) => r.sources ?? [])
  )

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
          {scoreBands().map((b, i) => (
            <span key={b.level}>
              {i > 0 && '・'}
              <strong>
                {RISK_BAND_LABELS[b.level]}({b.min}〜{b.max})
              </strong>
            </span>
          ))}
          の3段階に区分して色分け表示します。
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          評価モデルには適用範囲があり、用量がその範囲を超える入力では数値スコアを算出せず
          「適用範囲外」と表示します。その場合もタグ・相互作用・警告などの判断材料は表示を
          続けます。入力自体は受け付けますが、入力できることは用量の妥当性を意味しません。
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
          <li>
            用量の区分（高用量域など）や「適用範囲外」の境界は評価モデル用の内部区分であり、添付文書の承認最大用量・安全な用量とは異なります
          </li>
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
