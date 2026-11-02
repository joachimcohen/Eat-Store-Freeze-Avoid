import { data } from '../data'
import { formatDate } from '../rules/dates'
import { CAP_COLOURS, STICKER_TEXT } from '../components/verdictStyle'

const STEP_COLOURS = [...(['eat', 'store', 'freeze', 'avoid'] as const).map((v) => ({ bg: CAP_COLOURS[v], fg: STICKER_TEXT[v] })), { bg: '#141414', fg: '#ffffff' }]

export function About({ onShowDisclaimer, onShowFacts }: { onShowDisclaimer: () => void; onShowFacts: () => void }) {
  const a = data.wording.about
  const sources = [...data.sources].sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99))
  return (
    <>
      <h1 tabIndex={-1} className="display mt-6 text-3xl font-semibold">{a.title}</h1>
      <p className="mt-2">{a.intro}</p>

      <h2 className="display mt-6 text-xl font-semibold">{a.howTitle}</h2>
      <ol className="mt-3 grid gap-3">
        {a.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full font-extrabold" style={{ background: STEP_COLOURS[i % STEP_COLOURS.length].bg, color: STEP_COLOURS[i % STEP_COLOURS.length].fg }}>{i + 1}</span>
            <span>
              <span className="block font-extrabold">{s.title}</span>
              <span className="mt-0.5 block text-ink-soft">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <h2 className="display mt-6 text-xl font-semibold">{a.rulesTitle}</h2>
      <ol className="mt-2 grid list-decimal gap-2 pl-5">
        {a.how.map((h) => <li key={h}>{h}</li>)}
      </ol>
      <p className="mt-3 font-semibold">{data.wording.ifInDoubt}</p>

      <h2 className="display mt-6 text-xl font-semibold">{a.gapsTitle}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {a.gaps.map((g) => <li key={g} className="rounded-full bg-noinfo-bg px-3 py-1 text-sm">{g}</li>)}
      </ul>

      <h2 className="display mt-6 text-xl font-semibold">{a.sourcesTitle}</h2>
      <ul className="mt-2 grid gap-3">
        {sources.map((s) => (
          <li key={s.id} className="rounded-2xl bg-white p-3 shadow-card">
            <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-deep underline underline-offset-4">{s.name}</a>
            <p className="mt-1 text-sm">{s.usedFor}</p>
            {s.note && <p className="mt-1 text-sm text-ink-soft">{s.note}</p>}
            <p className="mt-1 text-xs text-ink-soft">
              {s.lastReviewed ? `Last reviewed ${formatDate(s.lastReviewed)}` : 'Review pending'}
              {s.pageUpdated ? `. Page updated ${formatDate(s.pageUpdated)}` : ''}.
            </p>
          </li>
        ))}
      </ul>

      <h2 className="display mt-6 text-xl font-semibold">{a.privacyTitle}</h2>
      <p className="mt-2">{a.privacy}</p>

      <h2 className="display mt-6 text-xl font-semibold">{a.aiTitle}</h2>
      <p className="mt-2">{a.ai}</p>

      <h2 className="display mt-6 text-xl font-semibold">{a.creditsTitle}</h2>
      <p className="mt-2">{a.credits}</p>

      <section aria-label={a.countryTitle} className="mt-6 rounded-[22px] bg-ink p-5 text-white">
        <h2 className="display text-xl">{a.countryTitle}</h2>
        <p className="mt-2 leading-relaxed text-[#e9e6df]">{a.country}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-x-5">
        <button type="button" onClick={onShowDisclaimer} className="min-h-11 font-medium text-brand-deep underline underline-offset-4">Read the disclaimer again</button>
        <button type="button" onClick={onShowFacts} className="min-h-11 font-medium text-brand-deep underline underline-offset-4">See a date fact</button>
      </div>
      <p className="mt-4 text-xs text-ink-soft">Data file last updated {formatDate(data.meta.lastUpdated)}.</p>
    </>
  )
}
