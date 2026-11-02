import { describe, expect, it } from 'vitest'
import { agreedReading, combineReadings, readLabel } from './label'

const TODAY = '2026-11-01'
const read = (t: string) => readLabel(t, TODAY)

describe('reading date labels', () => {
  it('acceptance test: "BEST BEFORE 12 MAR 26" gives best-before, 12 March 2026', () => {
    expect(read('BEST BEFORE 12 MAR 26')).toMatchObject({ dateType: 'best-before', date: '2026-03-12' })
  })
  it('reads use-by labels', () => {
    expect(read('USE BY 03/11/26')).toMatchObject({ dateType: 'use-by', date: '2026-11-03' })
    expect(read('Use-by: 3.11.2026')).toMatchObject({ dateType: 'use-by', date: '2026-11-03' })
    expect(read('UB 05 NOV 26')).toMatchObject({ dateType: 'use-by', date: '2026-11-05' })
  })
  it('reads short forms', () => {
    expect(read('BB 14/02/27')).toMatchObject({ dateType: 'best-before', date: '2027-02-14' })
    expect(read('B.B. 14-02-2027')).toMatchObject({ dateType: 'best-before', date: '2027-02-14' })
    expect(read('BEST BEF 1JAN27')).toMatchObject({ dateType: 'best-before', date: '2027-01-01' })
    expect(read('Best before 12 March 2026')).toMatchObject({ dateType: 'best-before', date: '2026-03-12' })
  })
  it('reads day first, Australian style', () => {
    expect(read('BB 02/03/27').date).toBe('2027-03-02')
  })
  it('month and year only uses the 1st of the month and says so', () => {
    expect(read('BEST BEFORE MAR 2027')).toMatchObject({ date: '2027-03-01', monthOnly: true })
    expect(read('BB 08 2027')).toMatchObject({ date: null })
  })
  it('a missing year uses the nearest date to today and says so', () => {
    expect(read('USE BY 03 NOV')).toMatchObject({ dateType: 'use-by', date: '2026-11-03', yearGuessed: true })
    expect(read('BB 28 DEC')).toMatchObject({ date: '2026-12-28', yearGuessed: true })
  })
  it('copes with common recognition slips', () => {
    expect(read('BEST BEFORE I2/O3/26')).toMatchObject({ dateType: 'best-before', date: '2026-03-12' })
    expect(read('USE BY 0CT 2027').date).toBe('2027-10-01')
  })
  it('ignores packed-on dates and prefers the date after the keyword', () => {
    expect(read('PACKED ON 01/11/26 USE BY 05/11/26')).toMatchObject({ dateType: 'use-by', date: '2026-11-05' })
    expect(read('PKD 01/11/26\nBB 05/12/26')).toMatchObject({ dateType: 'best-before', date: '2026-12-05' })
  })
  it('leaves the type empty when it cannot tell', () => {
    expect(read('12/03/27')).toMatchObject({ dateType: null, date: '2027-03-12' })
  })
  it('rejects impossible dates', () => {
    expect(read('BB 31/02/27').date).toBeNull()
    expect(read('BB 12/13/27').date).toBeNull()
  })
  it('returns nothing useful from unrelated text', () => {
    expect(read('Ingredients: wheat flour, water, salt')).toMatchObject({ dateType: null, date: null })
  })
  it('shows the text it read the date from', () => {
    expect(read('xx BEST BEFORE 12 MAR 26 L123').matchedText).toBe('BEST BEFORE 12 MAR 26')
  })
})

describe('dot-matrix slips and combining readings', () => {
  it('reads the slips seen on dot-matrix test labels', () => {
    expect(read('BEST BEFORE 12 HAR Z6')).toMatchObject({ dateType: 'best-before', date: '2026-03-12' })
  })
  it('uses the date most readings agree on', () => {
    const r = combineReadings(['USE BY 08/11/26', 'USE BY 05/11/26', 'USE BY 05/11/26', 'USE EY 05711726'], TODAY)
    expect(r).toMatchObject({ dateType: 'use-by', date: '2026-11-05' })
  })
  it('on a tie, uses the earlier date and use-by', () => {
    const r = combineReadings(['BB 08/11/26', 'USE BY 05/11/26'], TODAY)
    expect(r).toMatchObject({ dateType: 'use-by', date: '2026-11-05' })
  })
  it('keeps a date type even when no reading found a date', () => {
    expect(combineReadings(['USE BY', 'nothing'], TODAY)).toMatchObject({ dateType: 'use-by', date: null })
  })
})

describe('agreement for the live viewfinder', () => {
  it('waits until two readings agree', () => {
    expect(agreedReading(['USE BY 05/11/26', 'nothing'], TODAY)).toBeNull()
    expect(agreedReading(['USE BY 05/11/26', 'USE EY 05/11/26'], TODAY)).toMatchObject({ date: '2026-11-05', dateType: 'use-by' })
  })
  it('ignores a one-off misread', () => {
    expect(agreedReading(['BB 08/11/26', 'BB 05/11/26', 'BB 05/11/26'], TODAY)).toMatchObject({ date: '2026-11-05' })
  })
})

describe('dot-matrix "BB" slips', () => {
  it('reads PB, 8B and B8 as BB', () => {
    expect(read('PB 21 NOV 2026').dateType).toBe('best-before')
    expect(read('8B 21 NOV 2026').dateType).toBe('best-before')
  })
  it('the viewfinder takes the type from every reading of the strip', () => {
    // Seen on a tilted yoghurt lid: one reading slipped on the year, one on "BB".
    const r = agreedReading(['E 3\nBB 21 NOV 2028 4', 'QB 21 NOV 2026', '2 ov 202', 'E 3\nBB 21 NOV 2028 4', 'QB 21 NOV 2026'], TODAY)
    expect(r).toMatchObject({ date: '2026-11-21', dateType: 'best-before' })
  })
})
