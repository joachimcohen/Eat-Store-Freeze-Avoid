import { describe, expect, it } from 'vitest'
import { foodFromLabelText, searchFoods } from './search'

describe('search', () => {
  it('finds pasta first', () => {
    expect(searchFoods('pasta')[0]).toMatchObject({ term: 'pasta', category: { id: 'pasta-rice' } })
  })
  it('"UHT" finds long-life milk', () => {
    expect(searchFoods('UHT').map((r) => r.category?.id)).toContain('uht-milk')
  })
  it('copes with typos', () => {
    expect(searchFoods('chedar')[0].category?.id).toBe('hard-cheese')
    expect(searchFoods('yogurt')[0].category?.id).toBe('yoghurt-dips')
  })
  it('shows known gaps as not covered', () => {
    expect(searchFoods('milk')[0]).toMatchObject({ kind: 'not-covered', term: 'milk' })
  })
  it('finds categories by their Foodbank name', () => {
    expect(searchFoods('baby food').map((r) => r.category?.id)).toContain('baby-food')
  })
  it('returns nothing for nonsense or one letter', () => {
    expect(searchFoods('zzqxv')).toEqual([])
    expect(searchFoods('a')).toEqual([])
  })
  it('flags unchecked synonyms', () => {
    expect(searchFoods('cheddar')[0]).toMatchObject({ kind: 'synonym', checked: false })
  })
})

describe('food from label text', () => {
  it('suggests a known word found on the label', () => {
    expect(foodFromLabelText('GREEK YOGHURT 1KG BEST BEFORE 12 MAR 26')?.term).toBe('Greek yoghurt')
  })
  it('suggests nothing when no known word appears', () => {
    expect(foodFromLabelText('BEST BEFORE 12 MAR 26 L1234')).toBeNull()
  })
})

describe('honey', () => {
  it('is found, as an unchecked match', () => {
    expect(searchFoods('honey')[0]).toMatchObject({ term: 'honey', category: { id: 'shelf-stable-other' }, checked: false })
  })
})
