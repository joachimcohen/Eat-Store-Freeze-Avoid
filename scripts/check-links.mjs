// Checks every recipe link in the data file before an update goes live.
//   npm run check-links        report only
//   npm run check-links -- --fix   also mark dead links "broken": true so the
//                                  app hides them (and clears the mark on links
//                                  that work again)
// A link is only marked broken when the site clearly says it's gone (404 or
// 410). If the site can't be reached at all, the link is left as it is.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../src/data/foods.json', import.meta.url)
const fix = process.argv.includes('--fix')
const data = JSON.parse(readFileSync(FILE, 'utf8'))

const links = [
  ...data.recipeSources.map((r) => ({ item: r, label: r.name })),
  ...data.categories.flatMap((c) => c.recipeLinks.map((r) => ({ item: r, label: `${c.name}: ${r.title}` }))),
]

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'EatStoreFreezeAvoid-link-check/1.0' } })
      if (res.status === 404 || res.status === 410) return { state: 'dead', detail: res.status }
      if (res.ok) return { state: 'ok', detail: res.status }
      if (method === 'GET') return { state: 'unknown', detail: res.status }
    } catch (e) {
      if (method === 'GET') return { state: 'unknown', detail: e.cause?.code ?? e.message }
    }
  }
}

let dead = 0
for (const { item, label } of links) {
  const r = await check(item.url)
  const mark = { ok: 'OK     ', dead: 'DEAD   ', unknown: 'UNKNOWN' }[r.state]
  console.log(`${mark} ${label} (${r.detail})\n        ${item.url}`)
  if (r.state === 'dead') dead++
  if (fix && r.state === 'dead') item.broken = true
  if (fix && r.state === 'ok') delete item.broken
}

if (fix) writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n')
console.log(`\n${links.length} links checked, ${dead} dead.${fix ? ' Data file updated.' : dead ? ' Run with --fix to hide them.' : ''}`)
process.exitCode = dead ? 1 : 0
