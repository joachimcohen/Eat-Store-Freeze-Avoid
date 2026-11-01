// One test (or more) for every rule, in the order the rules are checked.
import { describe, expect, it } from 'vitest'
import { getCategory } from '../data'
import { addDays } from './dates'
import type { Category, VerdictInput } from './types'
import { decideVerdict } from './verdict'

const TODAY = '2026-11-01'
const cat = (id: string): Category => {
  const c = getCategory(id)
  if (!c) throw new Error(id)
  return c
}

function run(over: Partial<VerdictInput> & { daysFromToday?: number }) {
  const { daysFromToday = 0, ...rest } = over
  return decideVerdict({
    category: cat('pasta-rice'),
    dateType: 'best-before',
    date: addDays(TODAY, daysFromToday),
    today: TODAY,
    opened: false,
    storedProperly: true,
    damaged: false,
    freezeWindowDays: 1,
    ...rest,
  })
}

describe('checks that apply to every food', () => {
  it('damaged packaging is Avoid, even before the date', () => {
    expect(run({ damaged: true, daysFromToday: 300 }).verdict).toBe('avoid')
    expect(run({ damaged: true, category: null, dateType: 'use-by', daysFromToday: 5 }).verdict).toBe('avoid')
  })
  it('not stored as the label says is Avoid', () => {
    const r = run({ storedProperly: false, daysFromToday: 10 })
    expect(r).toMatchObject({ verdict: 'avoid', reason: 'not-stored', recallsLink: true })
  })
  it('no date on the pack is No verified info', () => {
    expect(run({ dateType: 'no-date', date: null }).verdict).toBe('no-info')
    expect(run({ dateType: 'no-date', date: null, category: null }).verdict).toBe('no-info')
  })
})

describe('use-by rules', () => {
  const meat = cat('fresh-meat-fish-meals')
  const other = cat('other-use-by')

  it('after the date is Avoid, with no look-and-smell advice', () => {
    const r = run({ category: meat, dateType: 'use-by', daysFromToday: -1 })
    expect(r).toMatchObject({ verdict: 'avoid', reason: 'use-by-passed', useByWarning: true, whatToCheck: null })
  })
  it('on the date or the day before, freezable food is Freeze', () => {
    expect(run({ category: meat, dateType: 'use-by', daysFromToday: 0 }).verdict).toBe('freeze')
    const r = run({ category: meat, dateType: 'use-by', daysFromToday: 1 })
    expect(r).toMatchObject({ verdict: 'freeze', freezingNote: 'can-freeze', extraCare: true })
  })
  it('two days before, freezable food is Store', () => {
    expect(run({ category: meat, dateType: 'use-by', daysFromToday: 2 }).verdict).toBe('store')
  })
  it('the freeze window comes from the setting', () => {
    expect(run({ category: meat, dateType: 'use-by', daysFromToday: 2, freezeWindowDays: 2 }).verdict).toBe('freeze')
  })
  it('on the date, food with unknown freezing is Eat (eat today, check the pack)', () => {
    const r = run({ category: other, dateType: 'use-by', daysFromToday: 0 })
    expect(r).toMatchObject({ verdict: 'eat', reason: 'use-by-today', freezingNote: 'check-pack', eatByAbout: null })
  })
  it('the day before, food with unknown freezing is Store', () => {
    expect(run({ category: other, dateType: 'use-by', daysFromToday: 1 }).verdict).toBe('store')
  })
  it('food not marked freezable never gets Freeze', () => {
    const notFreezable = { ...other, freezable: 'no' as const }
    const r = run({ category: notFreezable, dateType: 'use-by', daysFromToday: 0 })
    expect(r).toMatchObject({ verdict: 'eat', freezingNote: null })
  })
  it('use-by rules apply even when the food is matched to a best-before category', () => {
    const r = run({ category: cat('yoghurt-dips'), dateType: 'use-by', daysFromToday: -1 })
    expect(r).toMatchObject({ verdict: 'avoid', rules: 'use-by' })
  })
  it('"Not sure" is treated as use-by', () => {
    expect(run({ dateType: 'not-sure', daysFromToday: -1 }).verdict).toBe('avoid')
    expect(run({ dateType: 'not-sure', daysFromToday: -1 }).rules).toBe('use-by')
  })
  it('a food not in the list still gets the general use-by rules', () => {
    const r = run({ category: null, dateType: 'use-by', daysFromToday: 5 })
    expect(r).toMatchObject({ verdict: 'store', generalUseByRules: true, freezingNote: 'check-pack' })
    expect(run({ category: null, dateType: 'use-by', daysFromToday: 0 }).verdict).toBe('eat')
    expect(run({ category: null, dateType: 'use-by', daysFromToday: -1 }).verdict).toBe('avoid')
  })
  it('"Not sure" on a food not in the list gets the general use-by rules', () => {
    const r = run({ category: null, dateType: 'not-sure', daysFromToday: 3 })
    expect(r).toMatchObject({ verdict: 'store', generalUseByRules: true })
  })
  it('opened before the date is No verified info; opened after the date is still Avoid', () => {
    expect(run({ category: meat, dateType: 'use-by', daysFromToday: 3, opened: true }).verdict).toBe('no-info')
    expect(run({ category: meat, dateType: 'use-by', daysFromToday: -1, opened: true }).verdict).toBe('avoid')
  })
  it('every use-by result carries the "even if it looks and smells fine" line', () => {
    for (const d of [-1, 0, 1, 5]) {
      expect(run({ category: meat, dateType: 'use-by', daysFromToday: d }).useByWarning).toBe(true)
      expect(run({ category: meat, dateType: 'use-by', daysFromToday: d }).whatToCheck).toBeNull()
    }
  })
})

describe('best-before rules', () => {
  it('a food not in the list is No verified info', () => {
    expect(run({ category: null, daysFromToday: 10 }).verdict).toBe('no-info')
    expect(run({ category: null, daysFromToday: 10 }).reason).toBe('not-in-list')
  })
  it('opened is No verified info', () => {
    expect(run({ opened: true, daysFromToday: 10 }).verdict).toBe('no-info')
    expect(run({ opened: true, daysFromToday: -10 }).reason).toBe('opened')
  })
  it('on or before the date is Store, with a storage tip', () => {
    expect(run({ daysFromToday: 0 }).verdict).toBe('store')
    expect(run({ daysFromToday: 30 })).toMatchObject({ verdict: 'store', storageTip: 'label' })
  })
  it('no time allowed past the date (baby food) is Avoid once the date has passed', () => {
    expect(run({ category: cat('baby-food'), daysFromToday: -1 })).toMatchObject({ verdict: 'avoid', reason: 'best-before-no-window' })
    expect(run({ category: cat('baby-food'), daysFromToday: 0 }).verdict).toBe('store')
  })
  it('a best-before date on a use-by category is up to the date only', () => {
    expect(run({ category: cat('other-use-by'), daysFromToday: -1 }).verdict).toBe('avoid')
  })
  it('within the guidance window is Eat, with an "eat by about" date and checks', () => {
    // Fresh bread: up to 3 days.
    const r = run({ category: cat('fresh-bread'), daysFromToday: -3 })
    expect(r).toMatchObject({ verdict: 'eat', eatByAbout: TODAY, extraCare: true })
    expect(r.whatToCheck).toBeTruthy()
  })
  it('beyond the window is Avoid ("outside the guidance we use")', () => {
    const r = run({ category: cat('fresh-bread'), daysFromToday: -4 })
    expect(r).toMatchObject({ verdict: 'avoid', reason: 'outside-guidance', recallsLink: true })
  })
  it('best-before results never offer freezing', () => {
    for (const d of [-400, -10, -1, 0, 10]) expect(run({ daysFromToday: d }).verdict).not.toBe('freeze')
  })
})

describe('every result names a source', () => {
  it('has at least one source', () => {
    const combos: Partial<VerdictInput>[] = [
      { damaged: true }, { storedProperly: false }, { dateType: 'no-date', date: null },
      { dateType: 'use-by' }, { category: null }, { opened: true },
    ]
    for (const c of combos) expect(run(c).sourceIds.length).toBeGreaterThan(0)
  })
})
