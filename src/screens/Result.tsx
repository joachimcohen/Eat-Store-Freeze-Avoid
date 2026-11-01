import { Button } from '../components/ui'
import { VerdictSticker } from '../components/verdictStyle'
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
  const showRecipes = result.verdict === 'eat' || result.verdict === 'store' || result.verdict === 'freeze'

  return (
    <>
      <div className="mt-6 text-sm text-ink-soft"><MatchLine food={food} /></div>

      <h1 tabIndex={-1} className="mt-5 text-center">
        <VerdictSticker verdict={result.verdict} label={lines.label} />
      </h1>
      <p className="display mt-4 text-center text-lg">{lines.summary}</p>

      {/* Styled like the nutrition panel on a milk bottle */}
      <section aria-label="Details" className="mt-6 rounded-md border-2 border-ink bg-white p-3">
        <h2 className="border-b-[6px] border-ink pb-1 text-2xl font-black tracking-tight">Date facts</h2>
        <dl>
          <Row label="Why" text={lines.why} strong />
          {lines.eatByAbout && <Row label="Eat by" text={lines.eatByAbout} print />}
          {lines.facts.map((f) => <Row key={f.label} label={f.label} text={f.text} />)}
        </dl>
        <p className="mt-3 border-t-[6px] border-ink pt-2 text-lg font-black">{lines.ifInDoubt}</p>
        {result.recallsLink && (
          <p className="mt-1">
            <a className="font-medium text-brand-deep underline underline-offset-4" href={recalls.url} target="_blank" rel="noreferrer">{data.wording.recalls}</a>
          </p>
        )}
      </section>

      {showRecipes && <Recipes food={food} />}

      <div className="mt-4 text-xs leading-relaxed text-ink-soft">
        {lines.sources.map((s) => <p key={s}>{s}</p>)}
        <p className="mt-2">{data.wording.disclaimer}</p>
      </div>

      <div className="mt-6 grid gap-3">
        <Button onClick={onAgain}>Check another food</Button>
        <Button variant="secondary" onClick={onChange}>Change my answers</Button>
      </div>
    </>
  )
}

function Row({ label, text, strong = false, print = false }: { label: string; text: string; strong?: boolean; print?: boolean }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2 border-b border-ink/70 py-2 last:border-b-0">
      <dt className="font-bold">{label}</dt>
      <dd className={print ? 'print text-sm leading-relaxed' : strong ? 'font-semibold' : ''}>{text}</dd>
    </div>
  )
}

function Recipes({ food }: { food: FoodChoice }) {
  const w = data.wording.recipes
  const own = food.category?.recipeLinks.slice(0, 3) ?? []
  return (
    <section aria-label={w.heading} className="mt-5 rounded-3xl bg-cream p-4">
      <h2 className="display text-xl font-semibold"><span aria-hidden="true">🍳 </span>{w.heading}</h2>
      <p className="mt-1 text-sm text-ink-soft">{own.length > 0 ? w.perFood : w.intro}</p>
      <ul className="mt-2 grid gap-2">
        {(own.length > 0 ? own.map((r) => ({ name: r.title, url: r.url })) : data.recipeSources).map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between rounded-2xl bg-white px-4 py-2 font-medium text-brand-deep shadow-sm">
              {r.name}<span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">{w.note}</p>
    </section>
  )
}
