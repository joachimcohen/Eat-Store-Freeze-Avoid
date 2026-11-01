// Basic result screen. The full result card comes in build step 7.
import { Button } from '../components/ui'
import { VERDICT_COLOURS, VERDICT_ICONS } from '../components/verdictStyle'
import { data } from '../data'
import { describeResult } from '../rules/describe'
import type { VerdictResult } from '../rules/types'
import type { FoodChoice } from '../lib/search'
import { MatchLine } from './Confirm'

export function Result({ result, food, onChange, onAgain }: {
  result: VerdictResult
  food: FoodChoice
  onChange: () => void
  onAgain: () => void
}) {
  const lines = describeResult(result)
  const recalls = data.sources.find((s) => s.id === 'fsanz-recalls')!
  return (
    <>
      <div className="mt-5 text-sm"><MatchLine food={food} /></div>
      <h1 tabIndex={-1} className={`mt-3 flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${VERDICT_COLOURS[result.verdict]}`}>
        <span aria-hidden="true" className="text-4xl">{VERDICT_ICONS[result.verdict]}</span>
        <span className="print text-4xl">{lines.label}</span>
      </h1>
      <p className="mt-2 text-ink-soft">{lines.summary}</p>
      <p className="mt-4 text-lg font-semibold">{lines.why}</p>
      {lines.eatByAbout && <p className="print mt-2 text-lg">{lines.eatByAbout}</p>}
      {lines.notes.map((n) => <p key={n} className="mt-2">{n}</p>)}
      {result.recallsLink && (
        <p className="mt-3"><a className="underline underline-offset-4" href={recalls.url} target="_blank" rel="noreferrer">{data.wording.recalls}</a></p>
      )}
      <p className="mt-4 font-semibold">{lines.ifInDoubt}</p>
      <div className="mt-4 border-t border-rule pt-3 text-sm text-ink-soft">
        {lines.sources.map((s) => <p key={s} className="mt-1">{s}</p>)}
        <p className="mt-2">{data.wording.disclaimer}</p>
      </div>
      <div className="mt-6 grid gap-3">
        <Button onClick={onAgain}>Check another food</Button>
        <Button variant="secondary" onClick={onChange}>Change my answers</Button>
      </div>
    </>
  )
}
