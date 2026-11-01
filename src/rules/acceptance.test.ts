// The acceptance tests from the requirements that the rules decide.
// The rest (camera, offline, network) are checked on the phone.
import { describe, expect, it } from 'vitest'
import { data, getCategory, getSource } from '../data'
import { addDays, addMonths } from './dates'
import { decideVerdict } from './verdict'
import type { VerdictInput } from './types'

const TODAY = '2026-11-01'
const base: VerdictInput = {
  category: null, dateType: 'best-before', date: TODAY, today: TODAY,
  opened: false, storedProperly: true, damaged: false, freezeWindowDays: data.settings.freezeWindowDays,
}

describe('acceptance tests', () => {
  it('"pasta" with a best-before 3 months ago is Eat, with an eat by about date and Foodbank Victoria source', () => {
    const r = decideVerdict({ ...base, category: getCategory('pasta-rice'), date: addMonths(TODAY, -3) })
    expect(r.verdict).toBe('eat')
    expect(r.eatByAbout).toBe('2027-08-01')
    expect(r.sourceIds).toContain('foodbank-vic')
  })
  it('any food with yesterday\'s use-by date is Avoid, with no look-and-smell advice', () => {
    const yesterday = addDays(TODAY, -1)
    for (const c of [...data.categories, null]) {
      const r = decideVerdict({ ...base, category: c, dateType: 'use-by', date: yesterday })
      expect(r.verdict).toBe('avoid')
      expect(r.whatToCheck).toBeNull()
    }
  })
  it('a food not in the data file is No verified info', () => {
    expect(decideVerdict({ ...base, date: addDays(TODAY, -5) }).verdict).toBe('no-info')
  })
  it('"Opened" is No verified info', () => {
    for (const c of data.categories) {
      const r = decideVerdict({ ...base, category: c, date: addDays(TODAY, 3), dateType: c.usualDateType, opened: true })
      expect(r.verdict).toBe('no-info')
    }
  })
  it('baby food one day past its best-before is Avoid', () => {
    expect(decideVerdict({ ...base, category: getCategory('baby-food'), date: addDays(TODAY, -1) }).verdict).toBe('avoid')
  })
  it('every result shows a source with a last-reviewed date (or review pending)', () => {
    const r = decideVerdict({ ...base, category: getCategory('eggs'), date: addDays(TODAY, -3) })
    for (const id of r.sourceIds) {
      const s = getSource(id)
      expect(s).not.toBeNull()
      expect(s!.lastReviewed !== null || s!.status === 'to-review').toBe(true)
    }
  })
})
