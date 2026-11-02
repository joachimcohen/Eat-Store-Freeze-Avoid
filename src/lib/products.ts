// Barcode lookup through Open Food Facts, and matching a product to one of
// our categories. Only the barcode number is sent. Open Food Facts never
// gives advice here: it only tells us what the product is.
import { data, getCategory } from '../data'
import { allSynonymsInText, matchSynonymInText, searchFoods, type FoodChoice } from './search'

export type Product = { code: string; name: string; brand: string; categories: string[]; generic?: string }

export type LookupResult =
  | { status: 'found'; product: Product }
  | { status: 'not-found' }
  | { status: 'offline' }

const FIELDS = 'product_name,product_name_en,generic_name,generic_name_en,brands,categories_tags'

export async function lookupProduct(code: string, fetchImpl: typeof fetch = fetch): Promise<LookupResult> {
  let res: Response
  try {
    // Weak reception in a shop: give up after 8 seconds rather than hang.
    res = await fetchImpl(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal: AbortSignal.timeout(8000) })
  } catch {
    return { status: 'offline' }
  }
  if (res.status === 404) return { status: 'not-found' }
  if (!res.ok) return { status: 'offline' }
  const json = (await res.json()) as { status?: number; product?: Record<string, unknown> }
  if (json.status !== 1 || !json.product) return { status: 'not-found' }
  const p = json.product
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  return {
    status: 'found',
    product: {
      code,
      name: str(p.product_name_en) || str(p.product_name) || str(p.generic_name),
      brand: str(p.brands).split(',')[0]?.trim() ?? '',
      generic: str(p.generic_name_en) || str(p.generic_name),
      categories: Array.isArray(p.categories_tags) ? (p.categories_tags as unknown[]).filter((t): t is string => typeof t === 'string') : [],
    },
  }
}

const isFrozenProduct = (p: Product) => p.categories.some((t) => /frozen/.test(t)) || /\bfrozen\b/i.test(p.name)

/**
 * Suggests a category for a product, or null. The person always confirms.
 * 1. The most specific Open Food Facts category we have mapped.
 * 2. Otherwise an everyday word (synonym) in the product name or categories.
 * A frozen product only ever matches a frozen category, so frozen chicken
 * can't be matched to fresh meat (or the other way round).
 */
export function matchProduct(p: Product): FoodChoice | null {
  const label = [p.brand, p.name].filter(Boolean).join(' ') || `Barcode ${p.code}`
  const frozen = isFrozenProduct(p)
  const fits = (categoryId: string) => {
    const c = getCategory(categoryId)
    return c !== null && (c.group === 'frozen') === frozen
  }
  // Some categories need the product name to agree (fresh milk is often tagged UHT).
  const nameSays = (categoryId: string) => {
    const words = data.offCategories.nameMustSay[categoryId]
    if (!Array.isArray(words)) return true
    const n = `${p.name} ${p.brand}`.toLowerCase()
    return words.some((w) => n.includes(w))
  }
  const milkGap = (): FoodChoice => ({ kind: 'not-covered', term: label, category: null, usualDateType: null, checked: data.offCategories.checked })

  const map = data.offCategories.map
  for (const tag of [...p.categories].reverse()) {
    const target = map[tag]
    if (!target) continue
    if (target === 'not-covered') {
      return { kind: 'not-covered', term: label, category: null, usualDateType: null, checked: data.offCategories.checked }
    }
    if (!fits(target)) continue
    if (!nameSays(target)) return milkGap()
    const c = getCategory(target)!
    return { kind: 'synonym', term: label, category: c, usualDateType: c.usualDateType, checked: data.offCategories.checked }
  }

  const text = [p.name, ...p.categories.map((t) => t.replace(/^\w\w:/, '').replace(/-/g, ' '))].join(' \n ')
  const syn = matchSynonymInText(text, (s) => fits(s.categoryId))
  if (syn && !nameSays(syn.category!.id)) return milkGap()
  if (syn) return { ...syn, term: label }
  return null
}

/**
 * Up to three likely food types for a product, best first, for the person
 * to tap ("Is it one of these?"). Uses, in order: the best match above;
 * every mapped Open Food Facts category; everyday words anywhere in the
 * name, generic name or categories; then a fuzzy search on the name (copes
 * with odd spellings). Frozen products still only get frozen categories.
 * When the best match is the fresh-milk gap, long-life milk is offered too,
 * so the person can say which it is.
 */
export function suggestFoods(p: Product, max = 3): FoodChoice[] {
  const label = [p.brand, p.name].filter(Boolean).join(' ') || `Barcode ${p.code}`
  const frozen = isFrozenProduct(p)
  const fits = (id: string) => {
    const c = getCategory(id)
    return c !== null && (c.group === 'frozen') === frozen
  }
  const out: FoodChoice[] = []
  const seen = new Set<string>()
  const add = (f: FoodChoice | null) => {
    if (!f || out.length >= max) return
    const key = f.category?.id ?? `gap:${f.kind}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ ...f, term: label })
  }
  const asChoice = (id: string): FoodChoice => {
    const c = getCategory(id)!
    return { kind: 'synonym', term: label, category: c, usualDateType: c.usualDateType, checked: data.offCategories.checked }
  }

  const best = matchProduct(p)
  add(best)
  if (best?.kind === 'not-covered' && fits('uht-milk') && p.categories.some((t) => /milk/.test(t))) add(asChoice('uht-milk'))

  for (const tag of [...p.categories].reverse()) {
    const id = data.offCategories.map[tag]
    if (id && id !== 'not-covered' && fits(id) && !Array.isArray(data.offCategories.nameMustSay[id])) add(asChoice(id))
  }

  // Everyday words in the product's own name (not its category tags, where
  // "chicken eggs" would wrongly suggest chicken).
  const text = [p.name, p.generic ?? ''].join(' \n ')
  for (const s of allSynonymsInText(text, (x) => fits(x.categoryId) && !Array.isArray(data.offCategories.nameMustSay[x.categoryId]))) add(s)

  // Fuzzy search only when the stronger signals found little.
  if (out.length >= 2) return out
  for (const q of [p.name, p.generic ?? ''].filter((x) => x.trim().length >= 3)) {
    for (const r of searchFoods(q, 5)) {
      if ((r.kind === 'synonym' || r.kind === 'category') && r.category && fits(r.category.id) && !Array.isArray(data.offCategories.nameMustSay[r.category.id])) add(r)
    }
  }
  return out
}

// Remembered choices: barcode -> food type, on this phone only.
const KEY = 'esfa.barcodes'
type Saved = { kind: FoodChoice['kind']; term: string; categoryId: string | null }

function readAll(): Record<string, Saved> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

export function rememberedFood(code: string): FoodChoice | null {
  const s = readAll()[code]
  if (!s) return null
  const category = s.categoryId ? getCategory(s.categoryId) : null
  if (s.categoryId && !category) return null
  return {
    kind: s.kind, term: s.term, category,
    usualDateType: category?.usualDateType ?? null,
    checked: true,
  }
}

export function rememberFood(code: string, food: FoodChoice) {
  try {
    const all = readAll()
    all[code] = { kind: food.kind, term: food.term, categoryId: food.category?.id ?? null }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* storage blocked: fine, just not remembered */ }
}
