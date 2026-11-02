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
  /** Labelled facts for the result panel. */
  facts: { label: string; text: string }[]
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
