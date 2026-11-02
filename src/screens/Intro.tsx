// First-visit disclaimer and the "Did you know?" card shown on opening.
import { useState } from 'react'
import { Button } from '../components/ui'
import { data, getSource } from '../data'
import { prefs } from '../lib/prefs'

export function Disclaimer({ onAccept, again = false }: { onAccept: () => void; again?: boolean }) {
  const w = data.wording.firstVisit
  return (
    <>
      <h1 tabIndex={-1} className="display mt-6 text-3xl font-semibold">{w.title}</h1>
      <p className="display mt-4 rounded-[22px] bg-ink px-5 py-4 text-2xl leading-tight text-white">{w.lead}</p>
      <ul className="mt-4 grid gap-3">
        {w.points.map((p) => (
          <li key={p} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
            <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">!</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="display mt-5 text-center text-2xl">{w.closing}</p>
      <Button className="mt-5 w-full text-lg" onClick={onAccept}>{again ? 'Back' : w.button}</Button>
      <p className="mt-6 text-center text-sm text-ink-soft">{data.wording.footerCountry}</p>
    </>
  )
}

export function DidYouKnow({ onDone }: { onDone: () => void }) {
  const facts = data.facts
  const w = data.wording.didYouKnow
  const [i, setI] = useState(() => Math.floor(Math.random() * facts.length))
  const [hide, setHide] = useState(prefs.factsHidden())
  const fact = facts[i % facts.length]
  const source = getSource(fact.sourceId)
  return (
    <>
      <h1 tabIndex={-1} className="display mt-6 text-3xl font-semibold">{w.title}</h1>
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-ink p-6 text-white">
        <span aria-hidden="true" className="display absolute -top-6 -right-2 text-[9rem] leading-none font-bold text-white/10">?</span>
        <p aria-live="polite" className="display relative text-2xl leading-snug font-medium">{fact.text}</p>
        {source && <p className="print relative mt-4 text-[11px] text-[#cfcac0]">Source: {source.name}</p>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setI(i + 1)}>{w.next}</Button>
        <Button onClick={onDone}>{w.gotIt}</Button>
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 accent-brand" checked={hide} onChange={(e) => { setHide(e.target.checked); prefs.setFactsHidden(e.target.checked) }} />
        {w.dontShow}
      </label>
    </>
  )
}
