// Plain calendar dates ("YYYY-MM-DD"), worked out without time zones so a
// date never shifts by a day depending on where or when the phone is.

export type Period = { amount: number; unit: 'days' | 'weeks' | 'months' | 'years' }
export type Offset = { days?: number; months?: number; years?: number }

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function parts(date: string): [number, number, number] {
  const m = DATE.exec(date)
  if (!m) throw new Error(`Not a date: ${date}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function dayNumber(date: string): number {
  const [y, m, d] = parts(date)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Whole days from `from` to `to`. Positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

export function addDays(date: string, days: number): string {
  return fromUtc((dayNumber(date) + days) * 86_400_000)
}

/**
 * Adds months by the calendar: 15 March plus 2 months is 15 May.
 * If the day doesn't exist in the new month it moves back to the last day
 * (31 January plus 1 month is 28 or 29 February).
 */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = parts(date)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d, lastDay))
  return fromUtc(target.getTime())
}

export function addPeriod(date: string, period: Period): string {
  switch (period.unit) {
    case 'days':
      return addDays(date, period.amount)
    case 'weeks':
      return addDays(date, period.amount * 7)
    case 'months':
      return addMonths(date, period.amount)
    case 'years':
      return addMonths(date, period.amount * 12)
  }
}

export function applyOffset(date: string, offset: Offset): string {
  let result = date
  if (offset.years) result = addMonths(result, offset.years * 12)
  if (offset.months) result = addMonths(result, offset.months)
  if (offset.days) result = addDays(result, offset.days)
  return result
}

/** Today's date on this phone, in its own time zone. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Australian style: 15 May 2026 */
export function formatDate(date: string): string {
  const [y, m, d] = parts(date)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
