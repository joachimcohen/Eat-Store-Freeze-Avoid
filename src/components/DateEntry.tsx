// Day / Month / Year boxes, in the order Australian packs print them.
// The phone's own date box follows the phone's language, which can be
// US month-first; these boxes can't be read the wrong way round.
import { useEffect, useRef, useState } from 'react'
import { dateFromParts, formatDateLong } from '../rules/dates'

const box = 'min-h-12 w-full rounded-2xl border-2 border-rule bg-white px-3 text-center text-lg tabular-nums outline-none focus:border-ink'

export function DateEntry({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const split = (v: string) => (v ? { d: String(Number(v.slice(8, 10))), m: String(Number(v.slice(5, 7))), y: v.slice(0, 4) } : { d: '', m: '', y: '' })
  const [parts, setParts] = useState(() => split(value))
  const month = useRef<HTMLInputElement>(null)
  const year = useRef<HTMLInputElement>(null)

  // A date filled in from elsewhere (a scan) replaces what's in the boxes.
  useEffect(() => {
    const now = dateFromParts(parts.d, parts.m, parts.y)
    if (value && value !== now) setParts(split(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const set = (key: 'd' | 'm' | 'y', raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, key === 'y' ? 4 : 2)
    const next = { ...parts, [key]: digits }
    setParts(next)
    onChange(dateFromParts(next.d, next.m, next.y) ?? '')
    // Move on once a box is clearly complete.
    if (key === 'd' && (digits.length === 2 || Number(digits) > 3)) month.current?.focus()
    if (key === 'm' && (digits.length === 2 || Number(digits) > 1)) year.current?.focus()
  }

  const complete = parts.d && parts.m && (parts.y.length === 2 || parts.y.length === 4)
  const iso = dateFromParts(parts.d, parts.m, parts.y)

  return (
    <fieldset className="mt-5">
      <legend className="font-extrabold">Date on the pack</legend>
      <div className="mt-2 grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        <label className="text-sm font-semibold text-ink-soft">Day
          <input id="date-day" inputMode="numeric" autoComplete="off" placeholder="DD" value={parts.d} onChange={(e) => set('d', e.target.value)} className={`${box} mt-1`} />
        </label>
        <label className="text-sm font-semibold text-ink-soft">Month
          <input id="date-month" ref={month} inputMode="numeric" autoComplete="off" placeholder="MM" value={parts.m} onChange={(e) => set('m', e.target.value)} className={`${box} mt-1`} />
        </label>
        <label className="text-sm font-semibold text-ink-soft">Year
          <input id="date-year" ref={year} inputMode="numeric" autoComplete="off" placeholder="YY" value={parts.y} onChange={(e) => set('y', e.target.value)} className={`${box} mt-1`} />
        </label>
      </div>
      <p aria-live="polite" className="mt-2 min-h-6 font-semibold">
        {iso ? <>That's <span className="print">{formatDateLong(iso)}</span></> : complete ? <span className="text-avoid">That date doesn't exist. Please check it.</span> : null}
      </p>
    </fieldset>
  )
}
