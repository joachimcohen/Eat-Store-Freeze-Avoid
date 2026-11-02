import { FoodPicker } from '../components/FoodPicker'
import { PhotoButton } from '../components/PhotoButton'
import { CAP_COLOURS } from '../components/verdictStyle'
import { Panel } from '../components/ui'
import type { FoodChoice } from '../lib/search'

export function Find({ onPick, onPhoto, onQuiz }: { onPick: (f: FoodChoice) => void; onPhoto: (f: File) => void; onQuiz: () => void }) {
  return (
    <>
      <h1 className="display mt-6 text-3xl font-semibold" tabIndex={-1}>Is it still good?</h1>
      <p className="mt-1 text-ink-soft">Scan or type a food to find out whether to eat, store, freeze or avoid it.</p>

      <PhotoButton onPhoto={onPhoto} className="mt-5 w-full text-lg">
        <span aria-hidden="true">📷 </span>Scan the date label
      </PhotoButton>
      <p className="mt-2 text-center text-sm text-ink-soft">Your photo is read on this phone and never uploaded.</p>

      <Panel label="Find a food">
        <FoodPicker onPick={onPick} />
      </Panel>

      <button
        type="button"
        onClick={onQuiz}
        className="mt-4 flex w-full items-center gap-4 rounded-3xl bg-ink p-4 text-left text-white transition hover:brightness-125 focus-visible:outline-3 focus-visible:outline-brand"
      >
        <span aria-hidden="true" className="grid grid-cols-2 gap-1">
          {(['eat', 'store', 'freeze', 'avoid'] as const).map((v) => (
            <span key={v} className="block size-5 rounded-md" style={{ background: CAP_COLOURS[v] }} />
          ))}
        </span>
        <span>
          <span className="display block text-xl font-semibold">Quiz: Eat, Store, Freeze or Avoid?</span>
          <span className="block text-sm text-[#b9cdf5]">10 quick questions. How well do you know your dates?</span>
        </span>
      </button>
    </>
  )
}
