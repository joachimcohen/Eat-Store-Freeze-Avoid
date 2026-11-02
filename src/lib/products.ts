// Barcode lookup through Open Food Facts, and matching a product to one of
// our categories. Only the barcode number is sent. Open Food Facts never
// gives advice here: it only tells us what the product is.
import { data, getCategory } from '../data'
import { matchSynonymInText, type FoodChoice } from './search'

export type Product = { code: string; name: string; brand: string; categories: string[] }

export type LookupResult =
  | { status: 'found'; product: Product }
  | { status: 'not-found' }
  | { status: 'offline' }

const FIELDS = 'product_name,product_name_en,generic_name,brands,categories_tags'

export async function lookupProduct(code: string, fetchImpl: typeof fetch = fetch): Promise<LookupResult> {
  let res: Response
  try {
    res = await fetchImpl(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`)
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
