import { describe, expect, it } from 'vitest'
import { addMonths, addPeriod, applyOffset, daysBetween, formatDate } from './dates'

describe('calendar dates', () => {
  it('adds months by the calendar (2 months after 15 March is 15 May)', () => {
    expect(addPeriod('2026-03-15', { amount: 2, unit: 'months' })).toBe('2026-05-15')
  })
  it('moves back to the last day of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
  })
  it('adds weeks, days and years', () => {
    expect(addPeriod('2026-11-01', { amount: 2, unit: 'weeks' })).toBe('2026-11-15')
    expect(addPeriod('2026-12-30', { amount: 3, unit: 'days' })).toBe('2027-01-02')
    expect(addPeriod('2026-11-01', { amount: 1, unit: 'years' })).toBe('2027-11-01')
  })
  it('counts days across a daylight saving change', () => {
    expect(daysBetween('2026-10-03', '2026-10-05')).toBe(2)
    expect(daysBetween('2026-11-02', '2026-11-01')).toBe(-1)
  })
  it('applies relative offsets', () => {
    expect(applyOffset('2026-11-01', { months: -3 })).toBe('2026-08-01')
    expect(applyOffset('2026-11-01', { days: -21 })).toBe('2026-10-11')
  })
  it('formats dates the Australian way', () => {
    expect(formatDate('2026-05-15')).toBe('15 May 2026')
  })
})
