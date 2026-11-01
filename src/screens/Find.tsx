import { FoodPicker } from '../components/FoodPicker'
import { PhotoButton } from '../components/PhotoButton'
import type { FoodChoice } from '../lib/search'

export function Find({ onPick, onPhoto }: { onPick: (f: FoodChoice) => void; onPhoto: (f: File) => void }) {
  return (
    <>
      <h1 className="mt-5 text-2xl font-bold" tabIndex={-1}>Check a date label</h1>
      <p className="mt-1 text-ink-soft">Find out whether to eat, store, freeze or avoid a food.</p>

      <PhotoButton onPhoto={onPhoto} className="mt-5 w-full text-lg">
        <span aria-hidden="true">▣ </span>Scan the date label
      </PhotoButton>
      <p className="mt-2 text-sm text-ink-soft">Your photo is read on this phone and never uploaded.</p>

      <div className="mt-6 rounded-lg border border-rule bg-card p-4">
        <FoodPicker onPick={onPick} />
      </div>
    </>
  )
}
