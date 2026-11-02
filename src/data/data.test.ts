// Guards on the data file itself.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { data, getCategory, getSource, visibleRecipes } from '.'
import { applyOffset } from '../rules/dates'
import { decideVerdict } from '../rules/verdict'

const docs = (name: string) => readFileSync(resolve(__dirname, '../../docs', name), 'utf8')

/** Reads the table in docs/Source_data.md: category -> guidance text. */
function sourceTable(): Map<string, string> {
  const rows = docs('Source_data.md').split('\n').filter((l) => l.startsWith('| ') && !l.includes('---'))
  const map = new Map<string, string>()
  for (const row of rows.slice(1)) {
    const cells = row.split('|').map((c) => c.trim())
    map.set(cells[2], cells[4])
  }
  return map
}

function parseGuidance(text: string) {
  if (/^(None|Up to the use-by date only)/.test(text)) return null
  const m = /(\d+) (day|week|month|year)s?/.exec(text)
  if (!m) throw new Error(`Can't read guidance: ${text}`)
  return { amount: Number(m[1]), unit: `${m[2]}s` }
}

function allText(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(allText)
  if (value && typeof value === 'object') return Object.values(value).flatMap(allText)
  return []
}

describe('the data file matches the Source data document exactly', () => {
  const table = sourceTable()

  it('has one category for every row, and no extras', () => {
    expect(data.categories.length).toBe(table.size)
  })
  it('every guidance window matches the source table', () => {
    for (const c of data.categories) {
      const docName = c.name
      expect(table.has(docName), `${c.name} is in Source_data.md`).toBe(true)
      expect(c.guidance, c.name).toEqual(parseGuidance(table.get(docName)!))
    }
  })
  it('only fresh meat, fish and ready meals are marked freezable (the only freezing in the source)', () => {
    expect(data.categories.filter((c) => c.freezable === 'yes').map((c) => c.id)).toEqual(['fresh-meat-fish-meals'])
  })
  it('no freezer times yet (none in the source)', () => {
    for (const c of data.categories) expect(c.freezerTime).toBeNull()
  })
})

describe('links inside the data file', () => {
  it('every synonym points to a real category', () => {
    for (const s of data.synonyms) expect(getCategory(s.categoryId), s.term).not.toBeNull()
  })
  it('every synonym starts as not checked', () => {
    // Remove this test once checking begins.
    expect(data.synonyms.every((s) => s.checked === false)).toBe(true)
  })
  it('every source, tip and fact reference exists', () => {
    for (const c of data.categories) {
      for (const id of c.sourceIds) expect(getSource(id), id).not.toBeNull()
      expect(data.storageTips[c.storageTip], c.storageTip).toBeTruthy()
    }
    for (const f of data.facts) expect(getSource(f.sourceId), f.id).not.toBeNull()
    for (const q of data.quiz) expect(getSource(q.sourceId), q.id).not.toBeNull()
    for (const t of Object.values(data.storageTips)) expect(getSource(t.sourceId)).not.toBeNull()
  })
  it('synonym terms are unique', () => {
    const terms = data.synonyms.map((s) => s.term.toLowerCase())
    expect(new Set(terms).size).toBe(terms.length)
  })
})

describe('the quiz never teaches anything the app would not say', () => {
  for (const q of data.quiz) {
    it(`${q.id}: ${q.scenario}`, () => {
      const today = '2026-11-01'
      const r = decideVerdict({
        category: getCategory(q.inputs.categoryId),
        dateType: q.inputs.dateType,
        date: applyOffset(today, q.inputs.dateOffset),
        today,
        opened: q.inputs.opened,
        storedProperly: q.inputs.storedProperly,
        damaged: q.inputs.damaged,
        freezeWindowDays: data.settings.freezeWindowDays,
      })
      expect(r.verdict).toBe(q.answer)
    })
  }
  it('gives the same answers on any day of the year', () => {
    for (let m = 0; m < 12; m++) {
      const today = `2027-${String(m + 1).padStart(2, '0')}-${m === 1 ? '28' : '30'}`
      for (const q of data.quiz) {
        const r = decideVerdict({
          category: getCategory(q.inputs.categoryId), dateType: q.inputs.dateType,
          date: applyOffset(today, q.inputs.dateOffset), today, opened: q.inputs.opened,
          storedProperly: q.inputs.storedProperly, damaged: q.inputs.damaged,
          freezeWindowDays: data.settings.freezeWindowDays,
        })
        expect(r.verdict, `${q.id} on ${today}`).toBe(q.answer)
      }
    }
  })
})

describe('wording rules', () => {
  const text = allText(data)
  it('never says "safe"', () => {
    for (const t of allText(data.wording).concat(allText(data.facts), allText(data.quiz))) {
      expect(t, t).not.toMatch(/\bsafe\b|\bsafely\b|\bunsafe\b/i)
    }
  })
  it('has no em dashes', () => {
    for (const t of text) expect(t, t).not.toContain('—')
  })
  it('includes no personal names', () => {
    for (const t of text) expect(t, t).not.toMatch(/\bRex\b/)
  })
  it('uses Australian spelling for common words', () => {
    for (const t of text) expect(t, t).not.toMatch(/\b(yogurt|color|flavor|favorite|organization|center|fiber)\b/i)
  })
  it('every verdict ends with "If in doubt, throw it out."', () => {
    expect(data.wording.ifInDoubt).toBe('If in doubt, throw it out.')
  })
})

describe('recipe links', () => {
  it('every recipe source and food recipe link is a full https link', () => {
    for (const r of data.recipeSources) expect(r.url, r.name).toMatch(/^https:\/\//)
    for (const c of data.categories) for (const r of c.recipeLinks) expect(r.url, r.title).toMatch(/^https:\/\//)
  })
})

describe('Open Food Facts category map', () => {
  it('every mapping points to a real category or the known gaps', () => {
    for (const [tag, id] of Object.entries(data.offCategories.map)) {
      expect(id === 'not-covered' || getCategory(id) !== null, tag).toBe(true)
    }
  })
})

describe('dead recipe links are hidden', () => {
  it('hides a source the link checker marked broken', () => {
    const before = visibleRecipes(null).length
    data.recipeSources[0].broken = true
    try {
      expect(visibleRecipes(null).length).toBe(before - 1)
      expect(visibleRecipes(null).map((r) => r.url)).not.toContain(data.recipeSources[0].url)
    } finally {
      delete data.recipeSources[0].broken
    }
  })
  it('prefers recipes picked for the food, up to 3', () => {
    const c = getCategory('pasta-rice')!
    c.recipeLinks = [1, 2, 3, 4].map((n) => ({ title: `Pasta ${n}`, url: `https://example.org/${n}`, sourceId: 'x' }))
    try {
      expect(visibleRecipes('pasta-rice').map((r) => r.name)).toEqual(['Pasta 1', 'Pasta 2', 'Pasta 3'])
    } finally {
      c.recipeLinks = []
    }
  })
})

describe('recipe links per food', () => {
  it('each food has at most 3, each from a listed recipe source', () => {
    const ids = new Set(data.recipeSources.map((r) => r.id))
    for (const c of data.categories) {
      expect(c.recipeLinks.length, c.name).toBeLessThanOrEqual(3)
      for (const r of c.recipeLinks) expect(ids.has(r.sourceId), r.title).toBe(true)
    }
  })
  it('baby food never gets recipe suggestions of its own', () => {
    expect(getCategory('baby-food')!.recipeLinks).toEqual([])
  })
})
