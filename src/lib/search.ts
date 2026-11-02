// Search over category names, everyday synonyms and the "not covered" list.
// Runs on the phone; nothing typed is sent anywhere.

import Fuse from 'fuse.js'
import { data, getCategory } from '../data'
import type { Category } from '../rules/types'

export type FoodChoice = {
  /** category: picked from the list or browse. synonym: an everyday word.
   *  not-covered: a known gap. unknown: not found, carried on anyway. */
  kind: 'category' | 'synonym' | 'not-covered' | 'unknown'
  /** What the person picked or typed. */
  term: string
  category: Category | null
  /** Usual date type to pre-select, if there is one. */
  usualDateType: 'best-before' | 'use-by' | null
  /** False for synonyms not yet checked. */
  checked: boolean
}

function categoryChoice(c: Category): FoodChoice {
  return { kind: 'category', term: c.name, category: c, usualDateType: c.usualDateType, checked: c.checked }
}

const entries: FoodChoice[] = [
  ...data.synonyms.map((s): FoodChoice => ({
    kind: 'synonym',
    term: s.term,
    category: getCategory(s.categoryId),
    usualDateType: s.usualDateType === 'varies' ? null : s.usualDateType,
    checked: s.checked,
  })),
  ...data.categories.map(categoryChoice),
  ...data.notCovered.terms.map((t): FoodChoice => ({
    kind: 'not-covered', term: t, category: null, usualDateType: null, checked: true,
  })),
]

const fuse = new Fuse(entries, {
  keys: ['term'],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
})

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export function searchFoods(query: string, limit = 8): FoodChoice[] {
  const q = query.trim()
  if (q.length < 2) return []
  const cq = clean(q)
  const results = fuse.search(q).map((r) => {
    const t = clean(r.item.term)
    // Exact words and words that start with the query come first.
    const boost = t === cq ? -1 : t.startsWith(cq) || t.split(' ').includes(cq) ? -0.5 : 0
    return { item: r.item, score: (r.score ?? 1) + boost }
  })
  results.sort((a, b) => a.score - b.score)
  const seen = new Set<string>()
  const out: FoodChoice[] = []
  for (const r of results) {
    const key = `${r.item.kind}:${r.item.term}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r.item)
    if (out.length >= limit) break
  }
  return out
}

export function chooseCategory(c: Category): FoodChoice {
  return categoryChoice(c)
}

export function unknownFood(term: string): FoodChoice {
  return { kind: 'unknown', term: term.trim(), category: null, usualDateType: null, checked: true }
}

/** Lower case, "yogurt" spelt the Australian way, and plurals dropped, so "Yogurts" matches "yoghurt". */
function matchable(s: string): string {
  return clean(s.replace(/\(.*?\)/g, ''))
    .replace(/\byogurt/g, 'yoghurt')
    .split(' ')
    .map((w) => (w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w))
    .join(' ')
}

/** Finds a known everyday word (synonym) in some text, longest first. Only a suggestion. */
export function matchSynonymInText(text: string, allow: (s: { categoryId: string }) => boolean = () => true): FoodChoice | null {
  const t = ` ${matchable(text)} `
  const candidates = entries
    .filter((e) => e.kind === 'synonym' && e.category && allow({ categoryId: e.category.id }))
    .map((e) => ({ e, words: matchable(e.term) }))
    .filter(({ words }) => words.length >= 3 && t.includes(` ${words} `))
    .sort((a, b) => b.words.length - a.words.length)
  return candidates[0]?.e ?? null
}

/** Finds a known everyday word in label text. Only a suggestion. */
export function foodFromLabelText(text: string): FoodChoice | null {
  return matchSynonymInText(text)
}
