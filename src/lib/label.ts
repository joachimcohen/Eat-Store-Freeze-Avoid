// Reads the date type and date out of text recognised from a label photo.
// It never decides anything: the result is only used to pre-fill the
// Confirm screen, where the person checks it.

import { daysBetween } from '../rules/dates'
import type { DateType } from '../rules/types'

export type LabelReading = {
  dateType: DateType | null
  date: string | null
  /** Only month and year were printed; the 1st of the month is used (the earlier, safer day). */
  monthOnly: boolean
  /** No year was printed; the nearest matching date to today is used. */
  yearGuessed: boolean
  /** The part of the text the date was read from, shown to the person. */
  matchedText: string | null
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const MONTH_RE = '(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\\.?'

const KEYWORDS: { type: DateType; re: RegExp }[] = [
  { type: 'use-by', re: /\bUSE[\s.\-]*BY\b|\bU\.?\s?B\b\.?/g },
  { type: 'best-before', re: /\bBEST[\s.\-]*(?:BEF(?:ORE)?|BY)\b\.?|\bB\.?\s?B\.?\s?E?\b\.?/g },
]
/** Dates near these words are not the date we want. */
const IGNORE_BEFORE = /\b(PACKED|PACK|PKD|MFD|MADE|MANUFACTURED|PRODUCED|PROD|BAKED|LOT|BATCH)\b[\s.:ON]*$/

/** Fixes common recognition slips (O for 0, I or l for 1, S for 5, Z for 2) in short runs that already contain a digit. */
function fixDigits(text: string): string {
  return text.replace(/[0-9OoIlL|SZ]{1,4}/g, (run) =>
    /\d/.test(run) ? run.replace(/[Oo]/g, '0').replace(/[IlL|]/g, '1').replace(/S/g, '5').replace(/Z/g, '2') : run,
  )
}

function normalise(text: string): string {
  let t = text.toUpperCase().replace(/[‐-―]/g, '-')
  t = t.replace(/\b0CT\b/g, 'OCT').replace(/\bN0V\b/g, 'NOV').replace(/\bJUI\b/g, 'JUL').replace(/\bHAR\b/g, 'MAR').replace(/\bHAY\b/g, 'MAY')
    // Dot-matrix "BB" is often read as PB, 8B or B8.
    .replace(/\b(?:[P8]B|B[P8])\b/g, 'BB')
  return fixDigits(t)
}

function makeDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  // Rejects dates like 31 February.
  const check = new Date(Date.UTC(y, m - 1, d))
  if (check.getUTCMonth() !== m - 1) return null
  return iso
}

const fullYear = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y))

type Found = { index: number; end: number; date: string; monthOnly: boolean; yearGuessed: boolean }

function findDates(t: string, today: string): Found[] {
  const found: Found[] = []
  const taken: [number, number][] = []
  const free = (a: number, b: number) => taken.every(([x, y]) => b <= x || a >= y)
  const add = (m: RegExpExecArray, date: string | null, monthOnly = false, yearGuessed = false) => {
    if (!date || !free(m.index, m.index + m[0].length)) return
    taken.push([m.index, m.index + m[0].length])
    found.push({ index: m.index, end: m.index + m[0].length, date, monthOnly, yearGuessed })
  }

  // 12 MAR 26, 12MAR2026, 12 MARCH 26
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})\\s*${MONTH_RE}\\s*(\\d{4}|\\d{2})\\b`, 'g'))) {
    add(m, makeDate(fullYear(m[3]), MONTHS.indexOf(m[2]) + 1, Number(m[1])))
  }
  // 12/03/26, 12.03.2026, 12-03-26, 12 03 26
  for (const m of t.matchAll(/\b(\d{1,2})[\/.\-\s](\d{1,2})[\/.\-\s](\d{4}|\d{2})\b/g)) {
    add(m, makeDate(fullYear(m[3]), Number(m[2]), Number(m[1])))
  }
  // MAR 2027, MAR 27 (month and year only)
  for (const m of t.matchAll(new RegExp(`(?<!\\d\\s?)\\b${MONTH_RE}\\s*(\\d{4}|\\d{2})\\b`, 'g'))) {
    add(m, makeDate(fullYear(m[2]), MONTHS.indexOf(m[1]) + 1, 1), true)
  }
  // 12 MAR (no year): use whichever year puts it nearest to today.
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})\\s*${MONTH_RE}(?!\\s*\\d)`, 'g'))) {
    const year = Number(today.slice(0, 4))
    const options = [year - 1, year, year + 1]
      .map((y) => makeDate(y, MONTHS.indexOf(m[2]) + 1, Number(m[1])))
      .filter((d): d is string => d !== null)
    options.sort((a, b) => Math.abs(daysBetween(today, a)) - Math.abs(daysBetween(today, b)))
    add(m, options[0] ?? null, false, true)
  }
  // 12/03 (no year)
  for (const m of t.matchAll(/\b(\d{1,2})[\/.](\d{1,2})\b(?![\/.\-]?\d)/g)) {
    const year = Number(today.slice(0, 4))
    const options = [year - 1, year, year + 1]
      .map((y) => makeDate(y, Number(m[2]), Number(m[1])))
      .filter((d): d is string => d !== null)
    options.sort((a, b) => Math.abs(daysBetween(today, a)) - Math.abs(daysBetween(today, b)))
    add(m, options[0] ?? null, false, true)
  }
  return found.sort((a, b) => a.index - b.index)
}

export function readLabel(text: string, today: string): LabelReading {
  const empty: LabelReading = { dateType: null, date: null, monthOnly: false, yearGuessed: false, matchedText: null }
  const t = normalise(text)

  const keywords: { type: DateType; index: number; end: number }[] = []
  for (const k of KEYWORDS) {
    for (const m of t.matchAll(k.re)) keywords.push({ type: k.type, index: m.index!, end: m.index! + m[0].length })
  }
  keywords.sort((a, b) => a.index - b.index)

  const dates = findDates(t, today).filter((d) => !IGNORE_BEFORE.test(t.slice(Math.max(0, d.index - 20), d.index)))

  // Prefer a date that follows a keyword closely.
  let best: { date: Found; type: DateType | null; from: number } | null = null
  for (const k of keywords) {
    const next = dates.find((d) => d.index >= k.end && d.index - k.end <= 30)
    if (next && (!best || next.index - k.end < best.date.index - best.from)) best = { date: next, type: k.type, from: k.end }
  }
  if (!best && dates.length > 0) {
    // No keyword before a date. Only name a type if exactly one kind of keyword appears.
    const types = new Set(keywords.map((k) => k.type))
    best = { date: dates[0], type: types.size === 1 ? [...types][0] : null, from: dates[0].index }
  }
  if (!best) {
    const types = new Set(keywords.map((k) => k.type))
    return { ...empty, dateType: types.size === 1 ? [...types][0] : null }
  }

  const start = keywords.find((k) => k.end === best!.from)?.index ?? best.date.index
  return {
    dateType: best.type,
    date: best.date.date,
    monthOnly: best.date.monthOnly,
    yearGuessed: best.date.yearGuessed,
    matchedText: t.slice(start, best.date.end).replace(/\s+/g, ' ').trim(),
  }
}

/**
 * Combines several readings of the same photo. Uses the date most readings
 * agree on; on a tie, the earlier date (the more careful choice).
 */
export function combineReadings(texts: string[], today: string): LabelReading {
  const readings = texts.map((t) => readLabel(t, today))
  const withDate = readings.filter((r) => r.date)
  if (withDate.length === 0) {
    return readings.find((r) => r.dateType) ?? readings[0] ?? readLabel('', today)
  }
  const counts = new Map<string, number>()
  for (const r of withDate) counts.set(r.date!, (counts.get(r.date!) ?? 0) + 1)
  const [date] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  const chosen = withDate.filter((r) => r.date === date)
  const types = readings.map((r) => r.dateType).filter((t) => t !== null)
  const useBy = types.filter((t) => t === 'use-by').length
  const bestBefore = types.length - useBy
  // On a tie between types, use-by (the more careful choice).
  const dateType = types.length === 0 ? null : useBy >= bestBefore ? 'use-by' : 'best-before'
  return { ...(chosen.find((r) => r.dateType && r.matchedText) ?? chosen[0]), dateType }
}

/**
 * For the live viewfinder: the date that at least `votes` separate readings
 * agree on (with its date type), or null if there isn't one yet.
 */
export function agreedReading(texts: string[], today: string, votes = 2): LabelReading | null {
  const readings = texts.map((t) => readLabel(t, today)).filter((r) => r.date)
  const counts = new Map<string, number>()
  for (const r of readings) counts.set(r.date!, (counts.get(r.date!) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  if (!top || top[1] < votes) return null
  // Date: the one that was agreed. Type: voted on by every reading of the
  // strip, since a reading can catch the words but slip on a digit.
  const chosen = combineReadings(texts.filter((t) => readLabel(t, today).date === top[0]), today)
  const types = texts.map((t) => readLabel(t, today).dateType).filter((t) => t !== null)
  const useBy = types.filter((t) => t === 'use-by').length
  const dateType = types.length === 0 ? null : useBy >= types.length - useBy ? 'use-by' : 'best-before'
  return { ...chosen, dateType }
}
