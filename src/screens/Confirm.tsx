import { FoodPicker } from '../components/FoodPicker'
import { PhotoButton } from '../components/PhotoButton'
import { Button, Choice } from '../components/ui'
import { data } from '../data'
import { missing, type Draft } from '../draft'
import { formatDate } from '../rules/dates'
import type { DateTypeChoice } from '../rules/types'
import type { FoodChoice } from '../lib/search'

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')

export function MatchLine({ food }: { food: FoodChoice }) {
  if (food.kind === 'synonym' && food.category) {
    return (
      <>
        <p className="font-medium">{fill(data.wording.matchedTo, { term: food.term, category: food.category.name })}</p>
        {!food.checked && <p className="mt-1 text-sm text-store">{data.wording.matchUnchecked}</p>}
      </>
    )
  }
  if (food.kind === 'category' && food.category) return <p className="font-medium">{food.category.name} (Foodbank Victoria category)</p>
  return (
    <>
      <p className="font-medium">{food.term}</p>
      <p className="mt-1 text-sm text-ink-soft">Not in our checked list.</p>
    </>
  )
}

export function Confirm({ draft, update, onPhoto, onSubmit }: {
  draft: Draft
  update: (d: Partial<Draft>) => void
  onPhoto: (f: File) => void
  onSubmit: () => void
}) {
  const todo = missing(draft)
  const label = draft.label

  const pickFood = (food: FoodChoice) => {
    // Pre-select the usual date type, unless the label already told us.
    const fromLabel = label.status === 'done' && label.reading.dateType
    update({ food, dateType: fromLabel ? draft.dateType : (food.usualDateType ?? draft.dateType) })
  }

  return (
    <>
      <h1 className="display mt-6 text-3xl font-semibold" tabIndex={-1}>Check the details</h1>

      <section className="mt-4 rounded-3xl bg-carton p-4" aria-label="Food">
        {draft.food ? (
          <>
            <p className="text-sm text-ink-soft">Food</p>
            <MatchLine food={draft.food} />
            <Button variant="link" className="mt-1 -ml-1" onClick={() => update({ food: null })}>Not right? Choose another</Button>
          </>
        ) : (
          <>
            {label.status === 'done' && label.suggestedFood && (
              <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-sm">Found on the label:</p>
                <MatchLine food={label.suggestedFood} />
                <Button variant="secondary" className="mt-2 w-full" onClick={() => pickFood(label.suggestedFood!)}>Yes, use this</Button>
              </div>
            )}
            <FoodPicker onPick={pickFood} />
          </>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-carton p-4" aria-label="Date">
        <LabelStatus draft={draft} />
        <PhotoButton variant="secondary" onPhoto={onPhoto} className="mt-3 w-full">
          {label.status === 'idle' ? 'Read the date from a photo' : 'Try another photo'}
        </PhotoButton>

        <Choice<DateTypeChoice>
          legend="What does the label say?"
          name="dateType"
          value={draft.dateType}
          onChange={(dateType) => update({ dateType })}
          options={[
            { value: 'best-before', label: 'Best before' },
            { value: 'use-by', label: 'Use by' },
            { value: 'no-date', label: 'No date' },
            { value: 'not-sure', label: 'Not sure' },
          ]}
          hint={draft.dateType === 'not-sure' ? 'We\'ll treat it as a use-by date, to be careful.' : undefined}
        />

        {draft.dateType !== 'no-date' && (
          <div className="mt-5">
            <label htmlFor="date" className="font-semibold">Date on the pack</label>
            <input
              id="date"
              type="date"
              value={draft.date}
              onChange={(e) => update({ date: e.target.value })}
              className="mt-2 block min-h-12 w-full rounded-2xl border-2 border-rule bg-white px-4 text-lg outline-none focus:border-brand"
            />
            {draft.date && <p className="print mt-2" aria-hidden="true">{formatDate(draft.date)}</p>}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-carton p-4" aria-label="Quick questions">
        <Choice
          legend="Is it opened or unopened?"
          name="opened"
          value={draft.opened}
          onChange={(opened) => update({ opened })}
          options={[{ value: 'unopened', label: 'Unopened' }, { value: 'opened', label: 'Opened' }]}
        />
        <Choice
          legend="Has it been stored as the label says?"
          name="stored"
          hint="For example, kept in the fridge if the label says so."
          value={draft.stored}
          onChange={(stored) => update({ stored })}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
        />
        <Choice
          legend="Is the pack damaged, swollen or leaking?"
          name="damaged"
          value={draft.damaged}
          onChange={(damaged) => update({ damaged })}
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
        />
      </section>

      <Button className="mt-6 w-full text-lg" disabled={todo.length > 0} onClick={onSubmit}>Show the answer</Button>
      {todo.length > 0 && <p className="mt-2 text-sm text-ink-soft" aria-live="polite">Still needed: {todo.join(', ')}.</p>}
    </>
  )
}

function LabelStatus({ draft }: { draft: Draft }) {
  const label = draft.label
  if (label.status === 'idle') return <p className="text-sm text-ink-soft">Enter the date below, or read it from a photo of the label.</p>
  if (label.status === 'reading') {
    return (
      <div role="status">
        <p className="font-medium">Reading the label on this phone…</p>
        <progress className="mt-2 w-full" max={1} value={label.progress} />
      </div>
    )
  }
  if (label.status === 'failed') return <p role="status" className="font-medium">We couldn't read that photo. Please enter the date below.</p>
  const r = label.reading
  if (!r.date && !r.dateType) {
    return <p role="status" className="font-medium">We couldn't find a date in that photo. Please enter it below, or try a closer photo.</p>
  }
  return (
    <div role="status">
      <p className="text-sm text-ink-soft">We read:</p>
      <p className="print mt-1 text-lg">{r.matchedText ?? (r.dateType === 'use-by' ? 'Use by' : 'Best before')}</p>
      <p className="mt-2 font-medium">Please check the type and date below match the pack.</p>
      {r.monthOnly && <p className="mt-1 text-sm">Only a month and year were printed, so we've used the 1st of that month.</p>}
      {r.yearGuessed && <p className="mt-1 text-sm">No year was printed, so we've guessed it. Please check.</p>}
      {!r.dateType && <p className="mt-1 text-sm">We couldn't tell if it's best before or use by. Please choose.</p>}
    </div>
  )
}
