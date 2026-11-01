// Quiz: Eat, Store, Freeze or Avoid? 10 questions a round from the bank.
// The answer is worked out by the app's own rules, so the quiz can never
// teach something the app wouldn't say. Scores stay on this phone.
import { useMemo, useState } from 'react'
import { Button } from '../components/ui'
import { CAP_COLOURS, VERDICT_ICONS, VerdictSticker } from '../components/verdictStyle'
import { data, getCategory, getSource, type QuizQuestion } from '../data'
import { applyOffset, formatDate, localToday } from '../rules/dates'
import type { Verdict } from '../rules/types'
import { decideVerdict } from '../rules/verdict'

const ROUND = 10
const CHOICES = ['eat', 'store', 'freeze', 'avoid'] as const
const BEST_KEY = 'esfa.quizBest'

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function readBest(): number | null {
  try { const v = localStorage.getItem(BEST_KEY); return v ? Number(v) : null } catch { return null }
}
function saveBest(score: number) {
  try { localStorage.setItem(BEST_KEY, String(score)) } catch { /* private mode: fine */ }
}

function work(q: QuizQuestion, today: string) {
  const date = applyOffset(today, q.inputs.dateOffset)
  const r = decideVerdict({
    category: getCategory(q.inputs.categoryId),
    dateType: q.inputs.dateType,
    date,
    today,
    opened: q.inputs.opened,
    storedProperly: q.inputs.storedProperly,
    damaged: q.inputs.damaged,
    freezeWindowDays: data.settings.freezeWindowDays,
  })
  return { date, answer: r.verdict }
}

export function Quiz({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0)
  const questions = useMemo(() => shuffle(data.quiz).slice(0, ROUND), [round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Verdict | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)
  const today = localToday()
  const finished = index >= questions.length

  const restart = () => { setRound((r) => r + 1); setIndex(0); setPicked(null); setScore(0) }

  if (finished) {
    const great = score >= questions.length - 1
    return (
      <>
        <h1 tabIndex={-1} className="display mt-6 text-center text-3xl font-semibold">{great ? 'Top of the fridge!' : 'Round done!'}</h1>
        <p className="display mt-4 text-center text-6xl font-bold text-brand">{score}<span className="text-3xl text-ink-soft">/{questions.length}</span></p>
        {best !== null && <p className="mt-2 text-center text-ink-soft">Your best: {best}/{questions.length}</p>}
        <p className="mt-4 text-center">Remember: use-by is about safety, best-before is about quality.</p>
        <div className="mt-6 grid gap-3">
          <Button onClick={restart}>Play again</Button>
          <Button variant="secondary" onClick={onDone}>Back to checking food</Button>
        </div>
      </>
    )
  }

  const q = questions[index]
  const { date, answer } = work(q, today)
  const source = getSource(q.sourceId)
  const right = picked === answer

  const choose = (v: Verdict) => {
    if (picked) return
    setPicked(v)
    if (v === answer) setScore((s) => s + 1)
  }
  const next = () => {
    const last = index + 1 >= questions.length
    if (last) {
      const final = score
      if (best === null || final > best) { saveBest(final); setBest(final) }
    }
    setPicked(null)
    setIndex(index + 1)
  }

  return (
    <>
      {/* Progress: a little bottle filling with milk */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-carton" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1} aria-label="Quiz progress">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((index + (picked ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-medium text-ink-soft">{index + 1} of {questions.length}</span>
      </div>

      <h1 tabIndex={-1} className="display mt-5 text-2xl font-semibold">Eat, Store, Freeze or Avoid?</h1>

      <div className="mt-3 rounded-3xl bg-carton p-4">
        <p className="text-lg font-medium">{q.scenario}</p>
        <p className="print mt-3 inline-block rounded-md bg-white px-3 py-1.5 text-sm shadow-sm">
          {q.inputs.dateType === 'use-by' ? 'Use by' : 'Best before'} {formatDate(date)}
        </p>
        <p className="mt-2 text-sm text-ink-soft">Unopened and stored as the label says, unless it says otherwise.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Your answer">
        {CHOICES.map((v) => {
          const isAnswer = picked && v === answer
          const isWrongPick = picked === v && v !== answer
          return (
            <button
              key={v}
              type="button"
              onClick={() => choose(v)}
              aria-pressed={picked === v}
              disabled={picked !== null && !isAnswer && !isWrongPick}
              className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border-[3px] text-xl font-bold transition disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-brand ${
                isAnswer ? 'scale-105' : ''
              }`}
              style={{ borderColor: CAP_COLOURS[v], background: picked && !isAnswer && !isWrongPick ? '#fff' : `${CAP_COLOURS[v]}22` }}
            >
              <span aria-hidden="true" className="grid size-8 place-items-center rounded-full text-base text-white" style={{ background: CAP_COLOURS[v] }}>{VERDICT_ICONS[v]}</span>
              <span className="display">{data.wording.verdicts[v].label}</span>
              {isAnswer && <span className="sr-only">(correct answer)</span>}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="mt-5 rounded-md border-2 border-ink bg-white p-4" role="status">
          <p className="display text-2xl font-bold">{right ? 'Spot on! 🎉' : 'Not quite.'}</p>
          {!right && <div className="mt-2">The answer is <VerdictSticker verdict={answer} label={data.wording.verdicts[answer].label} size="sm" /></div>}
          <p className="mt-3">{q.why}</p>
          {source && (
            <p className="mt-2 text-xs text-ink-soft">
              Source: {source.name}. {source.lastReviewed ? `Last reviewed ${formatDate(source.lastReviewed)}.` : 'Review pending.'}
            </p>
          )}
          <Button className="mt-4 w-full" onClick={next}>{index + 1 >= questions.length ? 'See my score' : 'Next question'}</Button>
        </div>
      )}
    </>
  )
}
