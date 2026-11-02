// Sample Open Food Facts responses below are made-up test data shaped like
// the real API, used only to test the matching. They are not shipped.
import { describe, expect, it } from 'vitest'
import { lookupProduct, matchProduct, type Product } from './products'

const product = (name: string, categories: string[], brand = 'Brand'): Product => ({ code: '9300000000000', name, brand, categories })

describe('matching products to categories', () => {
  it('uses the most specific mapped Open Food Facts category', () => {
    const m = matchProduct(product('Greek Style Yogurt', ['en:dairies', 'en:fermented-foods', 'en:yogurts', 'en:greek-style-yogurts']))
    expect(m).toMatchObject({ category: { id: 'yoghurt-dips' }, term: 'Brand Greek Style Yogurt', checked: false })
  })
  it('long-life milk (name says UHT) goes to UHT milk, but fresh milk is a known gap', () => {
    expect(matchProduct(product('UHT Full Cream Milk', ['en:dairies', 'en:milks', 'en:uht-milks']))?.category?.id).toBe('uht-milk')
    expect(matchProduct(product('Full Cream Milk', ['en:dairies', 'en:milks', 'en:fresh-milks']))).toMatchObject({ kind: 'not-covered', category: null })
  })
  it('falls back to an everyday word in the name, with Australian spelling and plurals', () => {
    expect(matchProduct(product('Tasty Cheese Block', ['en:dairies']))?.category?.id).toBe('hard-cheese')
    expect(matchProduct(product('Spaghetti No. 5', []))?.category?.id).toBe('pasta-rice')
  })
  it('frozen products only match frozen categories', () => {
    // "chicken" is a fresh-meat synonym, but this is frozen.
    expect(matchProduct(product('Chicken Breast Fillets', ['en:meats', 'en:frozen-foods', 'en:chickens']))?.category?.group ?? null).not.toBe('use-by')
    expect(matchProduct(product('Frozen Peas', ['en:frozen-foods', 'en:frozen-vegetables']))?.category?.id).toBe('frozen-other')
  })
  it('gives no match rather than a guess', () => {
    expect(matchProduct(product('Mystery Product', ['en:something-else']))).toBeNull()
  })
})

describe('looking up a barcode', () => {
  const fakeFetch = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

  it('reads a found product', async () => {
    const r = await lookupProduct('9300000000000', fakeFetch(200, { status: 1, product: { product_name: 'Greek Yogurt', brands: 'Brand, Other', categories_tags: ['en:yogurts'] } }))
    expect(r).toEqual({ status: 'found', product: { code: '9300000000000', name: 'Greek Yogurt', brand: 'Brand', categories: ['en:yogurts'] } })
  })
  it('handles an unknown barcode', async () => {
    expect(await lookupProduct('1', fakeFetch(404, { status: 0 }))).toEqual({ status: 'not-found' })
    expect(await lookupProduct('1', fakeFetch(200, { status: 0 }))).toEqual({ status: 'not-found' })
  })
  it('handles no connection', async () => {
    const offline = (async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch
    expect(await lookupProduct('1', offline)).toEqual({ status: 'offline' })
  })
  it('only sends the barcode number', async () => {
    let url = ''
    const spy = (async (u: string) => { url = u; return new Response('{}', { status: 404 }) }) as unknown as typeof fetch
    await lookupProduct('9300000000000', spy)
    expect(url).toBe('https://world.openfoodfacts.org/api/v2/product/9300000000000.json?fields=product_name,product_name_en,generic_name,brands,categories_tags')
  })
})

// Real Australian products from Open Food Facts (see fixtures/off-products.json).
import real from './fixtures/off-products.json'

describe('matching real Australian products', () => {
  const expected: Record<string, string | null> = {
    '9300633386689': 'not-covered', // "Full Cream Milk" tagged both pasteurised and UHT: treated as fresh milk
    '9300639618661': 'not-covered', // same
    '9300601021246': 'hard-cheese',
    '9310264912768': 'hard-cheese',
    '9353712000297': 'fresh-meat-fish-meals', // vegetarian sausages: use-by rules either way
    '9310645326696': 'fresh-meat-fish-meals',
    '9310625012786': 'eggs',
    '9300633637057': 'eggs',
    '4061459943832': 'baby-food', // tagged baby food by Open Food Facts: the careful rules apply
    '4710144809587': 'baby-food',
    '9310052122515': 'butter',
    '9415007002062': 'butter',
  }
  for (const p of real.products) {
    it(`${p.brand} ${p.name}`, () => {
      const m = matchProduct(p)
      expect(m?.category?.id ?? m?.kind ?? null).toBe(expected[p.code])
    })
  }
  it('long-life milk is still matched when the name says so', () => {
    expect(matchProduct(product('UHT Full Cream Milk', ['en:milks', 'en:uht-milks']))?.category?.id).toBe('uht-milk')
    expect(matchProduct(product('Long Life Milk', ['en:milks']))?.category?.id).toBe('uht-milk')
  })
})
