// Turns a verdict into the lines shown on a result card, using only the
// wording in the data file.
import { data, getSource } from '../data'
import { daysBetween, formatDate, formatGap, formatPeriod } from './dates'
import type { VerdictResult } from './types'

export type ResultLines = {
  label: string
  summary: string
  why: string
  eatByAbout: string | null
  /** Labelled facts for the result panel. */
  facts: { label: string; text: string }[]
  /** "How we worked it out": the steps behind a date-based answer. */
  working: string[]
  /** All notes in one list (used by the rules check page). */
  notes: string[]
  sources: string[]
  ifInDoubt: string
}

const fill = (t: string, values: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '')

export function describeResult(r: VerdictResult): ResultLines {
  const w = data.wording
  const facts: { label: string; text: string }[] = []
  if (r.noDateHelp) facts.push({ label: w.noDate.lookAgainLabel, text: w.noDate.lookAgain })
  if (r.noDateHelp === 'long-life') facts.push({ label: w.noDate.longLifeLabel, text: w.noDate.longLife })
  if (r.generalUseByRules) facts.push({ label: 'Rules used', text: w.generalUseByRules })
  if (r.useByWarning && r.reason !== 'use-by-passed') facts.push({ label: 'Use-by', text: w.useByWarning })
  if (r.whatToCheck) facts.push({ label: 'Check', text: r.whatToCheck })
  if (r.storageTip) facts.push({ label: 'Storage', text: data.storageTips[r.storageTip].text })
  if (r.freezingNote) facts.push({ label: 'Freezing', text: w.freezing[r.freezingNote] })
  if (r.extraCare) facts.push({ label: 'Extra care', text: w.extraCare })

  const sources = r.sourceIds.map((id) => {
    const s = getSource(id)!
    return s.lastReviewed
      ? fill(w.sourceLine, { source: s.name, date: formatDate(s.lastReviewed) })
      : fill(w.sourceNotReviewed, { source: s.name })
  })

  return {
    working: working(r),
    label: w.verdicts[r.verdict].label,
    summary: w.verdicts[r.verdict].summary,
    why: w.reasons[r.reason],
    eatByAbout: r.eatByAbout ? fill(w.eatByAbout, { date: formatDate(r.eatByAbout) }) : null,
    facts,
    notes: facts.map((f) => f.text),
    sources,
    ifInDoubt: w.ifInDoubt,
  }
}

/** The steps behind a date-based answer, in plain words. */
export function working(r: VerdictResult): string[] {
  const t = r.timeline
  if (!t || r.verdict === 'no-info') return []
  const w = data.wording.timeline
  const date = formatDate(t.date)
  const out: string[] = []
  out.push(fill(t.treatedAsUseBy ? w.notSure : t.rules === 'use-by' ? w.useBy : w.bestBefore, { date }))
  // The date the gap to today is measured from.
  let anchor = t.date
  let what = t.rules === 'use-by' ? w.whatUseBy : w.whatBestBefore
  if (t.rules === 'use-by') {
    out.push(w.useByRule)
  } else if (t.window && t.windowEnd) {
    out.push(fill(w.window, { category: t.categoryName ?? 'this food', period: formatPeriod(t.window) }))
    // Before the date, the gap to the printed date matters more.
    if (daysBetween(t.today, t.date) < 0) {
      out.push(fill(w.windowEnd, { date: formatDate(t.windowEnd) }))
      anchor = t.windowEnd
      what = w.whatWindowEnd
    }
  } else {
    out.push(fill(w.noWindow, { category: t.categoryName ?? 'this food' }))
  }
  const gap = daysBetween(anchor, t.today)
  const today = formatDate(t.today)
  out.push(gap === 0 ? fill(w.todaySame, { today, what }) : fill(gap > 0 ? w.todayAfter : w.todayBefore, { today, duration: formatGap(gap), what }))
  return out
}
