// The page is a milk bottle: cap (coloured by the verdict), neck with the
// date printed on it, shoulders, label band and the white body.
import type { ReactNode } from 'react'
import { formatDate, localToday } from '../rules/dates'

export function Bottle({ capColour, onHome, children, footer }: {
  capColour: string
  onHome: () => void
  children: ReactNode
  footer: ReactNode
}) {
  const today = formatDate(localToday()).toUpperCase().replace(/(\d+) (\w{3})\w* \d{2}(\d{2})/, '$1 $2 $3')
  return (
    <div className="mx-auto max-w-xl px-3 pt-5 pb-12" style={{ ['--cap' as string]: capColour }}>
      {/* Cap */}
      <div className="cap mx-auto h-11 w-[42%] min-w-36 rounded-t-xl rounded-b-md shadow-md" aria-hidden="true" />
      {/* Neck ring and neck, with the dot-matrix date */}
      <div className="mx-auto h-2 w-[46%] min-w-40 rounded-full bg-white/90 shadow-sm" aria-hidden="true" />
      <div className="mx-auto flex h-9 w-[40%] min-w-34 items-center justify-center bg-white" aria-hidden="true">
        <span className="print text-[11px] text-ink-soft">PKD {today}</span>
      </div>
      {/* Shoulders */}
      <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="block h-14 w-full" aria-hidden="true">
        <path d="M120 0 H280 C280 34 400 26 400 70 H0 C0 26 120 34 120 0 Z" fill="#fff" />
      </svg>
      <div className="bottle -mt-px overflow-hidden rounded-b-[44px] bg-white">
        {/* Label band */}
        <header className="relative bg-brand text-white">
          <Wave className="absolute -top-px left-0 h-4 w-full rotate-180" />
          <button type="button" onClick={onHome} className="block w-full px-5 pt-6 pb-7 text-left" aria-label="Eat, Store, Freeze, Avoid: start again">
            <span className="display block text-[2rem] leading-none font-bold tracking-tight sm:text-4xl">
              Eat<span className="text-[#9cc2ff]">·</span>Store<span className="text-[#9cc2ff]">·</span>
              <br className="sm:hidden" />Freeze<span className="text-[#9cc2ff]">·</span>Avoid
            </span>
            <span className="mt-2 block text-sm font-medium text-[#d7e6ff]">Date labels, made simple</span>
          </button>
          <Wave className="absolute -bottom-px left-0 h-4 w-full" />
        </header>
        <main className="px-5 pb-6">{children}</main>
        <footer className="border-t border-dashed border-rule px-5 pt-4 pb-10 text-center text-sm text-ink-soft">{footer}</footer>
      </div>
    </div>
  )
}

function Wave({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 16 V8 C40 0 70 0 100 8 S160 16 200 8 S260 0 300 8 S360 16 400 8 V16 Z" fill="#fff" />
    </svg>
  )
}
