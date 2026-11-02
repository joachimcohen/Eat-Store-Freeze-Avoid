// "How we worked it out": the steps shown under each date-based answer.
import { describe, expect, it } from 'vitest'
import { data, getCategory } from '../data'
import { addDays, addMonths, formatGap, formatPeriod } from './dates'
import { working } from './describe'
import type { VerdictInput } from './types'
import { decideVerdict } from './verdict'

const TODAY = '2026-11-02'
const base: VerdictInput = {
  category: null, dateType: 'best-before', date: TODAY, today: TODAY,
  opened: false, storedProperly: true, damaged: false, freezeWindowDays: data.settings.freezeWindowDays,
}
const steps = (over: Partial<VerdictInput>) => working(decideVerdict({ ...base, ...over }))

describe('how we worked it out', () => {
  it('Avoid outside the guidance: shows the window, when it ended, and how long ago', () => {
    // The example from the project owner: 6 months past best-before.
    const s = steps({ category: getCategory('shelf-stable-other'), date: '2026-03-01' })
    expect(s).toEqual([
      'Best before 1 March 2026',
      'Guidance for All other shelf-stable products: up to 6 months past the best-before date.',
      'Generally OK to eat until about 1 September 2026.',
      'Today is 2 November 2026, about 2 months after the end of the guidance.',
    ])
  })
  it('Avoid past a use-by date: the safety rule and how long ago', () => {
    expect(steps({ category: getCategory('fresh-meat-fish-meals'), dateType: 'use-by', date: addDays(TODAY, -2) })).toEqual([
      'Use by 31 October 2026',
      'Use-by is a safety date: no time is allowed after it.',
      'Today is 2 November 2026, 2 days after the use-by date.',
    ])
  })
  it('Avoid for baby food: no time past the date', () => {
    const s = steps({ category: getCategory('baby-food'), date: addDays(TODAY, -1) })
    expect(s[1]).toBe('Guidance for Baby food: no time past the best-before date.')
    expect(s[2]).toBe('Today is 2 November 2026, 1 day after the best-before date.')
  })
  it('Eat: shows the window and how long is left', () => {
    const s = steps({ category: getCategory('hard-cheese'), date: addMonths(TODAY, -1) })
    expect(s).toEqual([
      'Best before 2 October 2026',
      'Guidance for Hard cheese (cheddar, edam): up to 2 months past the best-before date.',
      'Generally OK to eat until about 2 December 2026.',
      'Today is 2 November 2026, about 4 weeks before the end of the guidance.',
    ])
  })
  it('Store: counts down to the printed date', () => {
    expect(steps({ category: getCategory('eggs'), date: addDays(TODAY, 5) }).at(-1)).toBe('Today is 2 November 2026, 5 days before the best-before date.')
    expect(steps({ category: getCategory('fresh-meat-fish-meals'), dateType: 'use-by', date: TODAY }).at(-1)).toBe('Today is 2 November 2026, the same day as the use-by date.')
  })
  it('"Not sure" says it was treated as use-by', () => {
    expect(steps({ dateType: 'not-sure', date: addDays(TODAY, 3) })[0]).toBe('Date 5 November 2026 (treated as use-by, to be careful)')
  })
  it('no working for answers not based on a date', () => {
    expect(steps({ category: getCategory('eggs'), damaged: true })).toEqual([])
    expect(steps({ category: getCategory('eggs'), dateType: 'no-date', date: null })).toEqual([])
    expect(steps({ category: getCategory('eggs'), opened: true })).toEqual([])
  })
})

describe('periods and gaps in words', () => {
  it('reads naturally', () => {
    expect(formatPeriod({ amount: 1, unit: 'years' })).toBe('1 year')
    expect(formatPeriod({ amount: 6, unit: 'months' })).toBe('6 months')
    expect(formatGap(1)).toBe('1 day')
    expect(formatGap(-20)).toBe('about 3 weeks')
    expect(formatGap(62)).toBe('about 2 months')
    expect(formatGap(800)).toBe('about 2 years')
  })
})
