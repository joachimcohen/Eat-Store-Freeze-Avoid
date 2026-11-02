// The page is a gable-top milk carton in black and blue: sealed fin with a
// dot-matrix date, sloped roof with a screw cap (coloured by the verdict),
// black body with a blue wave, and a white panel for the content.
import type { ReactNode } from 'react'
import { formatDate, localToday } from '../rules/dates'

const shortDate = () => formatDate(localToday()).toUpperCase().replace(/(\d+) (\w{3})\w* \d{2}(\d{2})/, '$1 $2 $3')

export function Carton({ capColour, onHome, children, footer }: {
  capColour: string
  onHome: () => void
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="mx-auto max-w-xl px-3 pt-5 pb-12" style={{ ['--cap' as string]: capColour }}>
      {/* Sealed fin with the date printed on it */}
      <div className="mx-auto flex h-7 w-[46%] min-w-40 items-center justify-center rounded-t-sm bg-ink shadow-[inset_0_-3px_0_#ffffff14]" aria-hidden="true">
        <span className="print text-[11px] text-[#7fb0ff]">PKD {shortDate()}</span>
      </div>
      {/* Gable roof and cap */}
      <svg viewBox="0 0 400 130" preserveAspectRatio="none" className="-mt-px block h-24 w-full sm:h-28" aria-hidden="true">
        <defs>
          <linearGradient id="roof-l" x1="0" x2="1"><stop offset="0" stopColor="#0a3aa8" /><stop offset="1" stopColor="#155eef" /></linearGradient>
          <linearGradient id="roof-r" x1="0" x2="1"><stop offset="0" stopColor="#3b7bff" /><stop offset="1" stopColor="#155eef" /></linearGradient>
        </defs>
        <polygon points="108,0 200,0 200,130 0,130" fill="url(#roof-l)" />
        <polygon points="200,0 292,0 400,130 200,130" fill="url(#roof-r)" />
        <line x1="200" y1="0" x2="200" y2="130" stroke="#0d0f14" strokeOpacity=".25" strokeWidth="2" />
      </svg>
      <div className="relative">
        {/* Screw cap on the roof */}
        <div key={capColour} className="cap cap-spin absolute -top-[4.6rem] right-[22%] size-14 rounded-full border-4 border-white/70 shadow-lg sm:-top-[5.3rem]" aria-hidden="true" />
      </div>
      <div className="carton -mt-px overflow-hidden rounded-b-2xl bg-ink px-2.5 pb-2.5">
        <header className="relative -mx-2.5 px-2.5 text-white">
          <button type="button" onClick={onHome} className="block w-full px-3 pt-5 pb-9 text-left" aria-label="Eat, Store, Freeze, Avoid: start again">
            <span className="display block text-[2rem] leading-none font-bold tracking-tight sm:text-4xl">
              Eat<Dot />Store<Dot />
              <br className="sm:hidden" />Freeze<Dot />Avoid
            </span>
            <span className="print mt-3 block text-xs text-[#7fb0ff]">Best before? Use by? Let's check.</span>
          </button>
          <Wave />
        </header>
        <div className="rounded-xl bg-white">
          <main className="px-4 pt-2 pb-6 sm:px-5">{children}</main>
          <footer className="border-t border-dashed border-rule px-4 pt-4 pb-6 text-center text-sm text-ink-soft">{footer}</footer>
        </div>
        <p className="print px-2 pt-2 text-center text-[10px] text-[#7fb0ff]" aria-hidden="true">Keep refrigerated · L{shortDate().replace(/\D/g, '')}</p>
      </div>
    </div>
  )
}

const Dot = () => <span className="text-[#3b7bff]">·</span>

function Wave() {
  return (
    <svg viewBox="0 0 400 28" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-7 w-full" aria-hidden="true">
      <path d="M0 14 C50 2 90 2 140 12 S240 26 290 14 S370 2 400 10 V28 H0 Z" fill="#155eef" />
      <path d="M0 22 C60 12 100 12 150 20 S250 30 300 22 S370 14 400 18 V28 H0 Z" fill="#7fb0ff" />
    </svg>
  )
}
