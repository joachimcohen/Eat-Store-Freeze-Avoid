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

import { dateFromParts, formatDateLong } from './dates'

describe('typing a date in Australian order', () => {
  it('reads day, month, year', () => {
    expect(dateFromParts('5', '11', '26')).toBe('2026-11-05')
    expect(dateFromParts('05', '11', '2026')).toBe('2026-11-05')
  })
  it('rejects impossible or incomplete dates', () => {
    expect(dateFromParts('31', '2', '27')).toBeNull()
    expect(dateFromParts('5', '13', '26')).toBeNull()
    expect(dateFromParts('5', '11', '')).toBeNull()
    expect(dateFromParts('5', '11', '202')).toBeNull()
  })
  it('writes the date out with its weekday', () => {
    expect(formatDateLong('2027-02-03')).toBe('Wednesday 3 February 2027')
  })
})
