// The page shell: a sheet of dot stickers. A small header (dots and name,
// which starts again), the content, and the footer.
import type { ReactNode } from 'react'
import { formatDate, localToday } from '../rules/dates'
import { Dots } from './verdictStyle'

const shortDate = () => formatDate(localToday()).toUpperCase().replace(/(\d+) (\w{3})\w* \d{2}(\d{2})/, '$1 $2 $3')

export function Sheet({ onHome, children, footer }: { onHome: () => void; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 pt-4 pb-10">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onHome} className="flex min-h-11 items-center gap-2.5 rounded-full pr-2 font-extrabold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <Dots />
          <span className="whitespace-nowrap text-[15px] sm:text-base">Eat, Store, Freeze, Avoid</span>
          <span className="sr-only">: start again</span>
        </button>
        <span className="print hidden whitespace-nowrap text-[10px] text-ink-soft min-[420px]:inline" aria-hidden="true">PKD {shortDate()}</span>
      </header>
      <main>{children}</main>
      <footer className="mt-10 border-t border-dashed border-rule pt-4 text-center text-sm text-ink-soft">{footer}</footer>
    </div>
  )
}
