import { FoodPicker } from '../components/FoodPicker'
import { CAP_COLOURS, STICKER_TEXT, VerdictIcon } from '../components/verdictStyle'
import { Button, Panel } from '../components/ui'
import { data } from '../data'
import type { FoodChoice } from '../lib/search'

// The sticker montage at the top of the home screen.
const STICKERS = [
  { v: 'eat', left: '3%', top: 22, size: 128, rot: -8, font: 32, delay: 0 },
  { v: 'store', left: '30%', top: 66, size: 114, rot: 6, font: 27, delay: 90 },
  { v: 'freeze', left: '53%', top: 14, size: 120, rot: -4, font: 26, delay: 180 },
  { v: 'avoid', left: '70%', top: 104, size: 100, rot: 10, font: 24, delay: 270 },
] as const

export function Find({ onPick, onDateScan, onScan, onQuiz }: { onPick: (f: FoodChoice) => void; onDateScan: () => void; onScan: () => void; onQuiz: () => void }) {
  return (
    <>
      <div className="relative mx-auto mt-2 h-[226px] w-full max-w-[380px]" aria-hidden="true">
        <span className="peeled absolute -left-6 top-0 size-16" />
        <span className="peeled absolute right-6 bottom-2 size-10" />
        {STICKERS.map((s) => (
          <span
            key={s.v}
            className="sticker stick absolute flex flex-col items-center justify-center font-extrabold leading-none"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, rotate: `${s.rot}deg`, background: CAP_COLOURS[s.v], color: STICKER_TEXT[s.v], fontSize: s.font * 0.86, animationDelay: `${s.delay}ms` }}
          >
            <VerdictIcon verdict={s.v} size={Math.round(s.size * 0.24)} />
            <span className="mt-1">{data.wording.verdicts[s.v].label}</span>
          </span>
        ))}
        <span className="print absolute bottom-3 left-3 -rotate-2 rounded-full bg-white px-3 py-1.5 text-[11px] shadow-[0_1px_0_#0000001a]">Best before? Use by? Let's check.</span>
      </div>

      <h1 className="display mt-2 text-[2rem] leading-tight" tabIndex={-1}>Is it still good?</h1>
      <p className="mt-1 text-ink-soft">Scan or type a food to find out whether to eat, store, freeze or avoid it.</p>

      <Button onClick={onScan} className="mt-5 flex w-full items-center justify-center gap-3 text-lg">
        <svg aria-hidden="true" width="26" height="20" viewBox="0 0 26 20" fill="currentColor"><rect x="0" width="2" height="20" /><rect x="4" width="1" height="20" /><rect x="7" width="3" height="20" /><rect x="12" width="1" height="20" /><rect x="15" width="2" height="20" /><rect x="19" width="1" height="20" /><rect x="22" width="4" height="20" /></svg>
        Scan the barcode
      </Button>
      {data.settings.dateScanner && <Button variant="secondary" onClick={onDateScan} className="mt-3 w-full">Or scan the date label</Button>}
      <p className="mt-2 text-center text-sm text-ink-soft">The camera is read on this phone and nothing is uploaded.</p>

      <Panel label="Find a food">
        <FoodPicker onPick={onPick} />
      </Panel>

      <button
        type="button"
        onClick={onQuiz}
        className="mt-4 flex w-full items-center gap-4 rounded-[22px] bg-ink p-4 text-left text-white transition hover:brightness-125 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1f6fd1]"
      >
        <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-1">
          {(['eat', 'store', 'freeze', 'avoid'] as const).map((v) => (
            <span key={v} className="grid size-7 place-items-center rounded-full" style={{ background: CAP_COLOURS[v], color: STICKER_TEXT[v] }}>
              <VerdictIcon verdict={v} size={15} />
            </span>
          ))}
        </span>
        <span>
          <span className="display block text-lg leading-tight">Quiz: Eat, Store, Freeze or Avoid?</span>
          <span className="mt-0.5 block text-sm text-[#cfcac0]">10 quick questions. How well do you know your dates?</span>
        </span>
      </button>
    </>
  )
}
