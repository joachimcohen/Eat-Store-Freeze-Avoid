// "Today" is the phone's own date, in its own time zone. These check the
// edges of the day in Australian time zones, including daylight saving.
import { afterEach, describe, expect, it } from 'vitest'
import { localToday } from './dates'

const original = process.env.TZ
afterEach(() => { process.env.TZ = original })

describe("today's date follows the phone's time zone", () => {
  it('Melbourne (AEDT in November): 12:30 am is already the new day', () => {
    process.env.TZ = 'Australia/Melbourne'
    expect(localToday(new Date('2026-11-01T13:30:00Z'))).toBe('2026-11-02') // 12:30 am, 2 Nov AEDT
    expect(localToday(new Date('2026-11-01T12:30:00Z'))).toBe('2026-11-01') // 11:30 pm, 1 Nov AEDT
  })
  it('Brisbane (AEST all year)', () => {
    process.env.TZ = 'Australia/Brisbane'
    expect(localToday(new Date('2026-11-01T14:30:00Z'))).toBe('2026-11-02') // 12:30 am AEST
  })
  it('Perth (AWST): a different day at the same moment', () => {
    process.env.TZ = 'Australia/Perth'
    expect(localToday(new Date('2026-11-01T14:30:00Z'))).toBe('2026-11-01') // 10:30 pm AWST
  })
  it('Melbourne in winter (AEST)', () => {
    process.env.TZ = 'Australia/Melbourne'
    expect(localToday(new Date('2026-06-30T14:30:00Z'))).toBe('2026-07-01') // 12:30 am AEST
  })
})
