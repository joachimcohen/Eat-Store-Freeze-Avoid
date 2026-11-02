import { Button } from '../components/ui'
import { CAP_COLOURS, VerdictSticker } from '../components/verdictStyle'
import { data, visibleRecipes } from '../data'
import { describeResult } from '../rules/describe'
import type { VerdictResult } from '../rules/types'
import type { FoodChoice } from '../lib/search'
import { MatchLine } from './Confirm'

export function Result({ result, food, dateLine = null, fromBarcode = false, onChange, onNotRight, onAgain }: {
  result: VerdictResult
  /** The date as entered, for the little printed label, e.g. "Use by 3 Nov 2026". */
  dateLine?: string | null
  fromBarcode?: boolean
  food: FoodChoice
  onChange: () => void
  onNotRight: () => void
  onAgain: () => void
}) {
  const lines = describeResult(result)
  const recalls = data.sources.find((s) => s.id === 'fsanz-recalls')!
  const showRecipes = result.verdict === 'eat' || result.verdict === 'store' || result.verdict === 'freeze'

  return (
    <>
      <div className="mt-6 text-sm text-ink-soft">
        <MatchLine food={food} />
        <button type="button" onClick={onNotRight} className="min-h-11 font-medium text-brand-deep underline underline-offset-4">{data.wording.notRight}</button>
      </div>

      <div className="relative mt-3 flex justify-center">
        <h1 tabIndex={-1} className="m-0">
          <VerdictSticker verdict={result.verdict} label={lines.label} />
        </h1>
        {dateLine && (
          <span className="print absolute right-0 bottom-3 rotate-3 rounded-full bg-white px-3 py-2 text-[11px] shadow-[0_2px_0_#0000001a] sm:right-[12%]">{dateLine}</span>
        )}
      </div>
      <p className="display mt-4 text-center text-lg leading-snug">{lines.summary}</p>

      {lines.working.length > 0 && (
        <section aria-label={data.wording.timeline.title} className="mt-6 rounded-[22px] bg-white p-4 shadow-card">
          <h2 className="display text-xl">{data.wording.timeline.title}</h2>
          <ol className="mt-3">
            {lines.working.map((step, i) => {
              const last = i === lines.working.length - 1
              return (
                <li key={step} className="relative flex gap-3 pb-3 last:pb-0">
                  {!last && <span aria-hidden="true" className="absolute top-5 bottom-0 left-[9px] w-0.5 bg-rule" />}
                  <span
                    aria-hidden="true"
                    className="relative mt-0.5 size-5 shrink-0 rounded-full border-[3px]"
                    style={{ borderColor: last ? CAP_COLOURS[result.verdict] : '#141414', background: last ? CAP_COLOURS[result.verdict] : '#ffffff' }}
                  />
                  <span className={i === 0 ? 'print pt-0.5 text-sm' : last ? 'font-extrabold' : ''}>{step}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section aria-label="Details" className="mt-4 rounded-[22px] bg-white p-4 shadow-card">
        <h2 className="display border-b-[5px] border-ink pb-1 text-xl">Date facts</h2>
        <dl>
          <Row label="Why" text={lines.why} strong />
          {lines.eatByAbout && <Row label="Eat by" text={lines.eatByAbout} print />}
          {lines.facts.map((f) => <Row key={f.label} label={f.label} text={f.text} />)}
          {(result.verdict === 'eat' || result.verdict === 'freeze') && (
            <Row label="Shopping" text={data.wording.shopping[result.verdict]} />
          )}
        </dl>
        <p className="display mt-2 border-t-[5px] border-ink pt-2 text-lg">{lines.ifInDoubt}</p>
        {result.recallsLink && (
          <p className="mt-1">
            <a className="font-medium text-brand-deep underline underline-offset-4" href={recalls.url} target="_blank" rel="noreferrer">{data.wording.recalls}</a>
          </p>
        )}
      </section>

      {showRecipes && <Recipes food={food} />}

      <section aria-label={data.wording.disclaimerTitle} className="mt-5 flex gap-3 rounded-[22px] border-2 border-ink bg-white p-4">
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-extrabold text-white">!</span>
        <span>
          <span className="block font-extrabold">{data.wording.disclaimerTitle}</span>
          <span className="mt-0.5 block text-sm">{data.wording.disclaimer}</span>
        </span>
      </section>

      <div className="mt-4 text-xs leading-relaxed text-ink-soft">
        {lines.sources.map((s) => <p key={s}>{s}</p>)}
        {fromBarcode && <p>Product data from Open Food Facts (Open Database Licence).</p>}
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
    <div className="grid grid-cols-[6rem_1fr] gap-2 border-b border-rule py-2 last:border-b-0">
      <dt className="font-extrabold">{label}</dt>
      <dd className={print ? 'print text-sm leading-relaxed' : strong ? 'font-semibold' : ''}>{text}</dd>
    </div>
  )
}

function Recipes({ food }: { food: FoodChoice }) {
  const w = data.wording.recipes
  const links = visibleRecipes(food.category?.id ?? null)
  if (links.length === 0) return null
  const own = links[0].own
  return (
    <section aria-label={w.heading} className="mt-5 rounded-[22px] bg-cream p-4">
      <h2 className="display text-xl"><span aria-hidden="true">🍳 </span>{w.heading}</h2>
      <p className="mt-1 text-sm text-ink-soft">{own ? w.perFood : w.intro}</p>
      <ul className="mt-2 grid gap-2">
        {links.map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between rounded-2xl bg-white px-4 py-2 font-medium text-brand-deep shadow-sm">
              <span>
                {r.name}
                {r.source && <span className="block text-xs font-normal text-ink-soft">{r.source}</span>}
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">{w.note}</p>
    </section>
  )
}
