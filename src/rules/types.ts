import type { Period } from './dates'

export type DateType = 'best-before' | 'use-by'
export type DateTypeChoice = DateType | 'no-date' | 'not-sure'
export type Freezable = 'yes' | 'no' | 'unknown'

export type Category = {
  id: string
  name: string
  group: string
  usualDateType: DateType
  /** Time past the best-before date. null means none. */
  guidance: Period | null
  freezable: Freezable
  freezerTime: string | null
  storageTip: string
  whatToCheck: string | null
  sourceIds: string[]
  lastReviewed: string
  checked: boolean
  note?: string
  recipeLinks: { title: string; url: string; sourceId: string; broken?: boolean }[]
}

export type Verdict = 'eat' | 'store' | 'freeze' | 'avoid' | 'no-info'

export type Reason =
  | 'damaged'
  | 'not-stored'
  | 'use-by-passed'
  | 'use-by-freeze'
  | 'use-by-today'
  | 'use-by-not-yet'
  | 'best-before-not-yet'
  | 'within-guidance'
  | 'best-before-no-window'
  | 'outside-guidance'
  | 'opened'
  | 'no-date'
  | 'not-in-list'

export type VerdictInput = {
  /** The matched category, or null when the food isn't in the data file. */
  category: Category | null
  dateType: DateTypeChoice
  /** The printed date, "YYYY-MM-DD". Not needed for "no-date". */
  date: string | null
  /** Today's date on the phone, "YYYY-MM-DD". */
  today: string
  opened: boolean
  storedProperly: boolean
  damaged: boolean
  /** Days before the use-by date when Freeze is offered (set in the data file). */
  freezeWindowDays: number
}

export type VerdictResult = {
  verdict: Verdict
  reason: Reason
  /** Which set of rules decided it. */
  rules: 'use-by' | 'best-before' | 'checks'
  /** "Eat by about" date, only on Eat within the guidance window. */
  eatByAbout: string | null
  /** Food isn't in the list, so the general use-by rules were used. */
  generalUseByRules: boolean
  freezingNote: 'can-freeze' | 'check-pack' | null
  /** Storage tip key, shown on Store results. */
  storageTip: string | null
  /** Look and smell check: best-before Eat results only. */
  whatToCheck: string | null
  /** "Shouldn't be eaten even if it looks and smells fine": use-by results. */
  useByWarning: boolean
  /** Pregnancy, young children and so on: Eat and Freeze results. */
  extraCare: boolean
  /** Link to FSANZ recalls: Avoid results. */
  recallsLink: boolean
  /** No date on the pack: which help to show (look again; long-life explanation for pantry food). */
  noDateHelp: 'long-life' | 'look-again' | null
  /** The working behind a date-based answer, shown as "How we worked it out". */
  timeline: Timeline | null
  /** Sources behind this answer, most important first. */
  sourceIds: string[]
}

export type Timeline = {
  /** Which rules were used. "Not sure" uses the use-by rules. */
  rules: 'best-before' | 'use-by'
  treatedAsUseBy: boolean
  /** The date printed on the pack. */
  date: string
  today: string
  /** Best-before only: the category's name and its guidance window (null = none). */
  categoryName: string | null
  window: Period | null
  /** Best-before with a window: the end of it. */
  windowEnd: string | null
}
