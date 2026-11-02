import { FoodPicker } from '../components/FoodPicker'
import { Button, Choice } from '../components/ui'
import { data } from '../data'
import { missing, type BarcodeState, type Draft } from '../draft'
import { DateEntry } from '../components/DateEntry'
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

export function Confirm({ draft, update, onDateScan, onSubmit, onStartAgain }: {
  draft: Draft
  update: (d: Partial<Draft>) => void
  onDateScan: () => void
  onSubmit: () => void
  onStartAgain: () => void
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

      <section className="mt-4 rounded-[22px] bg-white p-4 shadow-card" aria-label="Food">
        {draft.food ? (
          <>
            <p className="text-sm text-ink-soft">Food</p>
            <MatchLine food={draft.food} />
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-paper px-3 py-2 text-sm font-semibold">
              <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-white">!</span>
              {data.wording.checkFoodType}
            </p>
            {draft.barcode?.status === 'remembered' && <p className="mt-1 text-sm text-ink-soft">You chose this for barcode {draft.barcode.code} before.</p>}
            {draft.barcode && draft.barcode.status !== 'remembered' && <p className="mt-1 text-sm text-ink-soft">Barcode {draft.barcode.code}</p>}
            <Button variant="link" className="mt-1 -ml-1" onClick={() => update({ food: null })}>Not right? Choose another</Button>
          </>
        ) : (
          <>
            {draft.barcode && <BarcodeStatus barcode={draft.barcode} onUse={pickFood} />}
            {!draft.barcode && label.status === 'done' && label.suggestedFood && (
              <div className="mb-4 rounded-2xl bg-paper p-3">
                <p className="text-sm">Found on the label:</p>
                <MatchLine food={label.suggestedFood} />
                <Button variant="secondary" className="mt-2 w-full" onClick={() => pickFood(label.suggestedFood!)}>Yes, use this</Button>
              </div>
            )}
            <FoodPicker onPick={pickFood} />
          </>
        )}
      </section>

      <section className="mt-4 rounded-[22px] bg-white p-4 shadow-card" aria-label="Date">
        {data.settings.dateScanner && (
          <>
            <LabelStatus draft={draft} />
            <Button variant={draft.barcode && label.status === 'idle' ? 'primary' : 'secondary'} onClick={onDateScan} className="mt-3 mb-5 w-full">
              {label.status !== 'idle' ? 'Scan the date again' : draft.barcode ? 'Now scan the date label' : 'Scan the date from the label'}
            </Button>
          </>
        )}

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

        {draft.dateType !== 'no-date' && <DateEntry value={draft.date} onChange={(date) => update({ date })} />}
      </section>

      <section className="mt-4 rounded-[22px] bg-white p-4 shadow-card" aria-label="Quick questions">
        <Choice
          legend="Is it opened or unopened?"
          name="opened"
          value={draft.opened}
          onChange={(opened) => update({ opened })}
          options={[{ value: 'unopened', label: 'Unopened' }, { value: 'opened', label: 'Opened' }]}
        />
        {draft.opened === 'opened' && (
          <div role="status" className="mt-4 rounded-2xl border-2 border-ink bg-paper p-4">
            <p className="display text-lg">{data.wording.openedStop.title}</p>
            <p className="mt-1">{data.wording.openedStop.text}</p>
            <p className="mt-2 font-extrabold">{data.wording.openedStop.useBy}</p>
            <p className="mt-2 font-extrabold">{data.wording.ifInDoubt}</p>
            <Button className="mt-4 w-full" onClick={onStartAgain}>{data.wording.openedStop.button}</Button>
          </div>
        )}
        {draft.opened !== 'opened' && (
          <>
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
          </>
        )}
      </section>

      {draft.opened !== 'opened' && (
        <>
      <Button className="mt-6 w-full text-lg" disabled={todo.length > 0} onClick={onSubmit}>Show the answer</Button>
      {todo.length > 0 && <p className="mt-2 text-sm text-ink-soft" aria-live="polite">Still needed: {todo.join(', ')}.</p>}
        </>
      )}
    </>
  )
}

function LabelStatus({ draft }: { draft: Draft }) {
  const label = draft.label
  if (label.status === 'idle') return <p className="text-sm text-ink-soft">Enter the date below, or scan it from the label.</p>
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

function BarcodeStatus({ barcode, onUse }: { barcode: BarcodeState; onUse: (f: FoodChoice) => void }) {
  const box = 'mb-4 rounded-2xl bg-paper p-3'
  switch (barcode.status) {
    case 'looking':
      return <p role="status" className={box}>Looking up barcode {barcode.code}… Only the number is sent.</p>
    case 'offline':
      return <p role="status" className={box}>Looking up a barcode needs a connection. Please choose the food type below.</p>
    case 'not-found':
      return <p role="status" className={box}>We couldn't find barcode {barcode.code}. Please choose the food type below.</p>
    case 'remembered':
      return null
    case 'found': {
      const product = [barcode.brand, barcode.name].filter(Boolean).join(' ') || `Barcode ${barcode.code}`
      return (
        <div role="status" className={box}>
          <p className="text-sm text-ink-soft">Barcode {barcode.code}</p>
          <p className="font-semibold">{product}</p>
          {barcode.suggestions.length > 0 ? (
            <>
              <p className="mt-3 font-extrabold">Is it one of these?</p>
              <ul className="mt-2 grid gap-2">
                {barcode.suggestions.map((f) => (
                  <li key={f.category?.id ?? f.kind}>
                    <button
                      type="button"
                      onClick={() => onUse(f)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 border-rule bg-white px-4 py-2 text-left font-semibold hover:border-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1f6fd1]"
                    >
                      <span>
                        {f.category ? f.category.name : 'Fresh milk or another food we don\'t cover yet'}
                        {f.kind === 'not-covered' && <span className="block text-sm font-normal text-ink-soft">If it's long-life (UHT) milk, choose that instead.</span>}
                      </span>
                      <span aria-hidden="true" className="text-xl">›</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-ink-soft">These matches have not been checked yet. None of these? Choose the food type below.</p>
            </>
          ) : (
            <p className="mt-1 text-sm">This product isn't matched to our list yet. Please choose the food type below.</p>
          )}
          <p className="mt-2 text-xs text-ink-soft">Product data from Open Food Facts.</p>
        </div>
      )
    }
  }
}
