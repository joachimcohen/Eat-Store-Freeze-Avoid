// Type to search, or browse the categories.
import { useId, useState } from 'react'
import { data } from '../data'
import { chooseCategory, searchFoods, unknownFood, type FoodChoice } from '../lib/search'

export function FoodPicker({ onPick, autoFocus = false }: { onPick: (f: FoodChoice) => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState('')
  const [browsing, setBrowsing] = useState(false)
  const id = useId()
  const results = searchFoods(query)

  return (
    <div>
      <label htmlFor={id} className="font-semibold">What is the food?</label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="For example yoghurt, pasta, UHT milk"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-2 block min-h-12 w-full rounded-lg border-2 border-ink bg-card px-3 text-lg"
      />
      {query.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card" aria-label="Suggestions">
          {results.map((r) => (
            <li key={`${r.kind}:${r.term}`}>
              <button type="button" onClick={() => onPick(r)} className="block min-h-12 w-full px-3 py-2 text-left hover:bg-carton">
                <span className="font-medium">{r.term}</span>
                {r.kind === 'synonym' && r.category && (
                  <span className="block text-sm text-ink-soft">→ {r.category.name}</span>
                )}
                {r.kind === 'not-covered' && <span className="block text-sm text-ink-soft">No verified information yet</span>}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => onPick(unknownFood(query))} className="block min-h-12 w-full px-3 py-2 text-left text-ink-soft hover:bg-carton">
              Not listed? Carry on with "{query.trim()}"
            </button>
          </li>
        </ul>
      )}

      <button
        type="button"
        aria-expanded={browsing}
        onClick={() => setBrowsing(!browsing)}
        className="mt-4 min-h-11 font-medium underline underline-offset-4"
      >
        {browsing ? 'Hide the food list' : 'Browse the food list'}
      </button>
      {browsing && (
        <div className="mt-2 grid gap-4">
          {data.groups.map((g) => (
            <section key={g.id}>
              <h3 className="print text-sm">{g.name}</h3>
              <ul className="mt-1 divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card">
                {data.categories.filter((c) => c.group === g.id).map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onPick(chooseCategory(c))} className="block min-h-12 w-full px-3 py-2 text-left hover:bg-carton">
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
