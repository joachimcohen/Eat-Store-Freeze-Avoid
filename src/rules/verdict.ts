// The decision rules. Checked in order; the first match wins.
// This file never contains food advice or figures: those come from the
// data file through the `category` passed in.

import { addPeriod, daysBetween } from './dates'
import type { Reason, Verdict, VerdictInput, VerdictResult } from './types'

const FOODBANK = 'foodbank-vic'
const FSANZ_DATES = 'fsanz-date-marking'
const FSANZ_STORING = 'fsanz-storing'
const BETTER_HEALTH = 'better-health'

function result(
  verdict: Verdict,
  reason: Reason,
  rules: VerdictResult['rules'],
  extra: Partial<VerdictResult> = {},
): VerdictResult {
  return {
    verdict,
    reason,
    rules,
    eatByAbout: null,
    generalUseByRules: false,
    freezingNote: null,
    storageTip: null,
    whatToCheck: null,
    useByWarning: false,
    extraCare: verdict === 'eat' || verdict === 'freeze',
    recallsLink: verdict === 'avoid',
    sourceIds: [FOODBANK],
    ...extra,
  }
}

export function decideVerdict(input: VerdictInput): VerdictResult {
  const { category, today, opened, storedProperly, damaged, freezeWindowDays } = input

  // Damaged or badly stored food is Avoid, whatever else is true.
  if (damaged) return result('avoid', 'damaged', 'checks', { sourceIds: [BETTER_HEALTH, FOODBANK] })
  if (!storedProperly) return result('avoid', 'not-stored', 'checks', { sourceIds: [FSANZ_STORING, FOODBANK] })

  // No date on the pack (or no date entered): nothing to work from.
  if (input.dateType === 'no-date' || !input.date) return result('no-info', 'no-date', 'checks')
  const date = input.date

  // "Not sure" is treated as use-by. A use-by date always gets the use-by
  // rules, whatever category the food is matched to, and even when the food
  // isn't in the list.
  if (input.dateType === 'use-by' || input.dateType === 'not-sure') {
    const daysLeft = daysBetween(today, date)
    const useBy = { useByWarning: true, generalUseByRules: category === null }
    const useBySources = [FOODBANK, FSANZ_DATES, BETTER_HEALTH]

    if (daysLeft < 0) return result('avoid', 'use-by-passed', 'use-by', { ...useBy, sourceIds: useBySources })

    // The guidance covers unopened food only.
    if (opened) return result('no-info', 'opened', 'use-by', useBy)

    const canFreeze = category?.freezable === 'yes'
    // Freezing unknown (or not in the list): point to the pack instead.
    const freezingNote = canFreeze ? 'can-freeze' : category?.freezable === 'no' ? null : 'check-pack'

    if (canFreeze && daysLeft <= freezeWindowDays) {
      return result('freeze', 'use-by-freeze', 'use-by', { ...useBy, freezingNote, sourceIds: useBySources })
    }
    if (daysLeft === 0) {
      return result('eat', 'use-by-today', 'use-by', { ...useBy, freezingNote, sourceIds: useBySources })
    }
    return result('store', 'use-by-not-yet', 'use-by', {
      ...useBy,
      freezingNote,
      storageTip: category?.storageTip ?? 'label',
      sourceIds: [...useBySources, FSANZ_STORING],
    })
  }

  // Best-before from here on.
  // No match, no answer.
  if (category === null) return result('no-info', 'not-in-list', 'checks')
  if (opened) return result('no-info', 'opened', 'best-before')

  const daysLeft = daysBetween(today, date)
  if (daysLeft >= 0) {
    return result('store', 'best-before-not-yet', 'best-before', {
      storageTip: category.storageTip,
      sourceIds: [FOODBANK, FSANZ_DATES, FSANZ_STORING],
    })
  }

  // No time allowed past the date (for example baby food), or a best-before
  // date on a use-by category: up to the date only.
  if (category.guidance === null || category.usualDateType === 'use-by') {
    return result('avoid', 'best-before-no-window', 'best-before')
  }

  const eatByAbout = addPeriod(date, category.guidance)
  if (daysBetween(today, eatByAbout) >= 0) {
    return result('eat', 'within-guidance', 'best-before', {
      eatByAbout,
      whatToCheck: category.whatToCheck,
      sourceIds: [FOODBANK, BETTER_HEALTH],
    })
  }
  return result('avoid', 'outside-guidance', 'best-before')
}
