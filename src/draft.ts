import type { LabelReading } from './lib/label'
import type { FoodChoice } from './lib/search'
import type { DateTypeChoice } from './rules/types'

export type LabelState =
  | { status: 'idle' }
  | { status: 'reading'; progress: number }
  | { status: 'done'; reading: LabelReading; suggestedFood: FoodChoice | null }
  | { status: 'failed' }

export type BarcodeState =
  | { status: 'looking'; code: string }
  | { status: 'found'; code: string; name: string; brand: string; suggestions: FoodChoice[] }
  | { status: 'remembered'; code: string; food: FoodChoice }
  | { status: 'not-found'; code: string }
  | { status: 'offline'; code: string }

/** Everything the person has entered so far. Lives in memory only. */
export type Draft = {
  food: FoodChoice | null
  dateType: DateTypeChoice | null
  /** "YYYY-MM-DD" or empty. */
  date: string
  opened: 'unopened' | 'opened' | null
  stored: 'yes' | 'no' | null
  damaged: 'no' | 'yes' | null
  label: LabelState
  barcode: BarcodeState | null
}

export const emptyDraft: Draft = {
  food: null, dateType: null, date: '', opened: null, stored: null, damaged: null, label: { status: 'idle' }, barcode: null,
}

/** What still needs answering before a verdict can be shown. */
export function missing(d: Draft): string[] {
  const out: string[] = []
  if (!d.opened) out.push('opened or unopened')
  if (!d.food) out.push('the food')
  if (!d.dateType) out.push('the date type')
  if (d.dateType && d.dateType !== 'no-date' && !d.date) out.push('the date')
  if (!d.stored) out.push('how it was stored')
  if (!d.damaged) out.push('whether the pack is damaged')
  return out
}
