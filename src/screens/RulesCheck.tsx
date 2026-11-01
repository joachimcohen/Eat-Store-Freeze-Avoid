// Stop 1 page: shows the rules working on every quiz scenario and the
// acceptance examples, so they can be checked on a phone before any
// real screens are built.
import { data, getCategory } from '../data'
import { addDays, addMonths, applyOffset, formatDate, localToday } from '../rules/dates'
import { describeResult } from '../rules/describe'
import type { Verdict, VerdictInput } from '../rules/types'
import { decideVerdict } from '../rules/verdict'

const ICONS: Record<Verdict, string> = { eat: '✓', store: '■', freeze: '❄', avoid: '✕', 'no-info': '?' }
const COLOURS: Record<Verdict, string> = {
  eat: 'text-eat bg-eat-bg border-eat',
  store: 'text-store bg-store-bg border-store',
  freeze: 'text-freeze bg-freeze-bg border-freeze',
  avoid: 'text-avoid bg-avoid-bg border-avoid',
  'no-info': 'text-noinfo bg-noinfo-bg border-noinfo',
}

type Example = { title: string; input: VerdictInput; expected?: Verdict }

function examples(today: string): Example[] {
  const base = {
    today, opened: false, storedProperly: true, damaged: false,
    freezeWindowDays: data.settings.freezeWindowDays,
  }
  const quiz: Example[] = data.quiz.map((q) => ({
    title: `Quiz ${q.id.slice(1)}: ${q.scenario}`,
    expected: q.answer,
    input: {
      ...base, ...q.inputs,
      category: getCategory(q.inputs.categoryId),
      date: applyOffset(today, q.inputs.dateOffset),
    },
  }))
  const extra: Example[] = [
    { title: 'Pasta, best before 3 months ago', expected: 'eat',
      input: { ...base, category: getCategory('pasta-rice'), dateType: 'best-before', date: addMonths(today, -3) } },
    { title: 'A food not in our list, best before last week', expected: 'no-info',
      input: { ...base, category: null, dateType: 'best-before', date: addDays(today, -7) } },
    { title: 'A food not in our list, use by in 3 days', expected: 'store',
      input: { ...base, category: null, dateType: 'use-by', date: addDays(today, 3) } },
    { title: 'Yoghurt, opened, best before tomorrow', expected: 'no-info',
      input: { ...base, category: getCategory('yoghurt-dips'), dateType: 'best-before', date: addDays(today, 1), opened: true } },
    { title: 'Hummus matched to dips, but the pack says use by today', expected: 'eat',
      input: { ...base, category: getCategory('yoghurt-dips'), dateType: 'use-by', date: today } },
    { title: 'Cheddar, best before 2 weeks ago, left out of the fridge', expected: 'avoid',
      input: { ...base, category: getCategory('hard-cheese'), dateType: 'best-before', date: addDays(today, -14), storedProperly: false } },
  ]
  return [...quiz, ...extra]
}

function Card({ ex }: { ex: Example }) {
  const r = decideVerdict(ex.input)
  const lines = describeResult(r)
  const ok = !ex.expected || ex.expected === r.verdict
  return (
    <li className="rounded-lg border border-rule bg-card p-4 shadow-sm">
      <p className="text-sm text-ink-soft">{ex.title}</p>
      {ex.input.date && (
        <p className="print mt-1 text-sm">
          {ex.input.dateType === 'use-by' ? 'Use by' : 'Best before'} {formatDate(ex.input.date)}
        </p>
      )}
      <div className={`mt-3 flex items-center gap-3 rounded-md border-2 px-3 py-2 ${COLOURS[r.verdict]}`}>
        <span aria-hidden="true" className="text-2xl">{ICONS[r.verdict]}</span>
        <span className="print text-2xl">{lines.label}</span>
      </div>
      <p className="mt-3 font-medium">{lines.why}</p>
      {lines.eatByAbout && <p className="mt-1">{lines.eatByAbout}</p>}
      {lines.notes.map((n) => <p key={n} className="mt-1 text-sm text-ink-soft">{n}</p>)}
      <p className="mt-2 text-sm font-medium">{lines.ifInDoubt}</p>
      {lines.sources.map((s) => <p key={s} className="mt-1 text-xs text-ink-soft">{s}</p>)}
      {!ok && <p className="mt-2 font-bold text-avoid">Expected {ex.expected}, got {r.verdict}</p>}
    </li>
  )
}

export function RulesCheck() {
  const today = localToday()
  const list = examples(today)
  return (
    <div className="mt-5">
      <section className="border-b-2 border-dashed border-ink pb-4">
        <p className="print text-sm">Prototype · not for public use</p>
        <h1 tabIndex={-1} className="print mt-1 text-2xl leading-tight">Rules check</h1>
        <p className="mt-2 text-ink-soft">
          Rules check for {formatDate(today)}. Every example below is worked out live by the app's rules from the
          data file. The real screens come next.
        </p>
      </section>
      <ul className="mt-6 grid gap-4">
        {list.map((ex) => <Card key={ex.title} ex={ex} />)}
      </ul>
    </div>
  )
}
