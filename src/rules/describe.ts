// Turns a verdict into the lines shown on a result card, using only the
// wording in the data file.
import { data, getSource } from '../data'
import { formatDate } from './dates'
import type { VerdictResult } from './types'

export type ResultLines = {
  label: string
  summary: string
  why: string
  eatByAbout: string | null
  notes: string[]
  sources: string[]
  ifInDoubt: string
}

const fill = (t: string, values: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '')

export function describeResult(r: VerdictResult): ResultLines {
  const w = data.wording
  const notes: string[] = []
  if (r.generalUseByRules) notes.push(w.generalUseByRules)
  if (r.useByWarning && r.reason !== 'use-by-passed') notes.push(w.useByWarning)
  if (r.whatToCheck) notes.push(r.whatToCheck)
  if (r.storageTip) notes.push(data.storageTips[r.storageTip].text)
  if (r.freezingNote) notes.push(w.freezing[r.freezingNote])
  if (r.extraCare) notes.push(w.extraCare)

  const sources = r.sourceIds.map((id) => {
    const s = getSource(id)!
    return s.lastReviewed
      ? fill(w.sourceLine, { source: s.name, date: formatDate(s.lastReviewed) })
      : fill(w.sourceNotReviewed, { source: s.name })
  })

  return {
    label: w.verdicts[r.verdict].label,
    summary: w.verdicts[r.verdict].summary,
    why: w.reasons[r.reason],
    eatByAbout: r.eatByAbout ? fill(w.eatByAbout, { date: formatDate(r.eatByAbout) }) : null,
    notes,
    sources,
    ifInDoubt: w.ifInDoubt,
  }
}
