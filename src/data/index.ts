// Typed access to the data file.

import raw from './foods.json'
import type { Category, Verdict } from '../rules/types'
import type { Offset } from '../rules/dates'

export type Source = {
  id: string
  rank: number | null
  name: string
  url: string
  usedFor: string
  status: 'confirmed' | 'to-review'
  lastReviewed: string | null
  pageUpdated?: string
  note?: string
}

export type Synonym = {
  term: string
  categoryId: string
  usualDateType: 'best-before' | 'use-by' | 'varies'
  note: string | null
  checked: boolean
}

export type Fact = { id: string; text: string; sourceId: string; checked: boolean }

export type QuizQuestion = {
  id: string
  scenario: string
  photo: string | null
  inputs: {
    categoryId: string
    dateType: 'best-before' | 'use-by'
    dateOffset: Offset
    opened: boolean
    storedProperly: boolean
    damaged: boolean
  }
  answer: Exclude<Verdict, 'no-info'>
  why: string
  sourceId: string
  checked: boolean
}

export type FoodData = {
  meta: { version: number; lastUpdated: string; about: string }
  settings: { freezeWindowDays: number }
  sources: Source[]
  storageTips: Record<string, { text: string; sourceId: string }>
  groups: { id: string; name: string }[]
  categories: Category[]
  synonyms: Synonym[]
  notCovered: { message: string; terms: string[] }
  facts: Fact[]
  quiz: QuizQuestion[]
  offCategories: { note: string; checked: boolean; map: Record<string, string>; nameMustSay: Record<string, string[] | string> }
  recipeSources: { id: string; name: string; url: string; checked: boolean; broken?: boolean }[]
  wording: typeof raw.wording
}

export const data = raw as unknown as FoodData

const byId = new Map(data.categories.map((c) => [c.id, c]))

export function getCategory(id: string): Category | null {
  return byId.get(id) ?? null
}

export function getSource(id: string): Source | null {
  return data.sources.find((s) => s.id === id) ?? null
}

/** Recipe links to show: dead links (marked by the link checker) are hidden. */
export function visibleRecipes(categoryId: string | null): { name: string; url: string; own: boolean; source: string | null }[] {
  const sourceName = (id: string) => data.recipeSources.find((s) => s.id === id)?.name ?? null
  const own = (categoryId ? getCategory(categoryId)?.recipeLinks ?? [] : [])
    .filter((r) => !r.broken)
    .slice(0, 3)
    .map((r) => ({ name: r.title, url: r.url, own: true, source: sourceName(r.sourceId) }))
  if (own.length > 0) return own
  return data.recipeSources.filter((r) => !r.broken).map((r) => ({ name: r.name, url: r.url, own: false, source: null }))
}
