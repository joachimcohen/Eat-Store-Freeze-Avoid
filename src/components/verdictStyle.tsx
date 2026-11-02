import type { Verdict } from '../rules/types'

/** Sticker colour for each verdict. Store is amber, so its text is dark. */
export const CAP_COLOURS: Record<Verdict | 'default', string> = {
  default: '#141414',
  eat: '#157f40',
  store: '#f2a516',
  freeze: '#1b63c6',
  avoid: '#d22f27',
  'no-info': '#5b6170',
}
export const STICKER_TEXT: Record<Verdict, string> = {
  eat: '#ffffff', store: '#141414', freeze: '#ffffff', avoid: '#ffffff', 'no-info': '#ffffff',
}

export const VERDICT_ICONS: Record<Verdict, string> = { eat: '✓', store: '■', freeze: '❄', avoid: '✕', 'no-info': '?' }
export const VERDICT_COLOURS: Record<Verdict, string> = {
  eat: 'text-eat bg-eat-bg border-eat',
  store: 'text-store bg-store-bg border-store',
  freeze: 'text-freeze bg-freeze-bg border-freeze',
  avoid: 'text-avoid bg-avoid-bg border-avoid',
  'no-info': 'text-noinfo bg-noinfo-bg border-noinfo',
}

/** Line icons drawn in the sticker's text colour. */
export function VerdictIcon({ verdict, size = 32 }: { verdict: Verdict; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (verdict) {
    case 'eat': return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'store': return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M10 14h4" /></svg>
    case 'freeze': return <svg {...common}><path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9 4l3 2 3-2M9 20l3-2 3 2" /></svg>
    case 'avoid': return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'no-info': return <svg {...common}><path d="M9.2 9a3 3 0 1 1 4 2.8c-.8.4-1.2 1-1.2 1.9v.6" /><circle cx="12" cy="18" r=".6" fill="currentColor" /></svg>
  }
}

/** The verdict as a round sticker. Large on results, small inline in the quiz. */
export function VerdictSticker({ verdict, label, size = 'lg' }: { verdict: Verdict; label: string; size?: 'lg' | 'sm' }) {
  const style = { background: CAP_COLOURS[verdict], color: STICKER_TEXT[verdict] }
  if (size === 'sm') {
    return (
      <span className="sticker inline-flex items-center gap-1.5 px-3 py-1 align-middle font-extrabold" style={style}>
        <VerdictIcon verdict={verdict} size={16} />{label}
      </span>
    )
  }
  const long = label.length > 7
  return (
    <span className="relative inline-block size-48">
      <span className="peeled absolute inset-0 translate-x-3 translate-y-2" aria-hidden="true" />
      <span className="sticker stick absolute inset-0 flex -rotate-6 flex-col items-center justify-center p-5 text-center" style={style}>
        <VerdictIcon verdict={verdict} size={34} />
        <span className={`display mt-1 leading-none ${long ? 'text-2xl' : 'text-[2.6rem]'}`}>{label}</span>
      </span>
    </span>
  )
}

/** Four little dots, one per verdict. */
export function Dots({ size = 14 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-1">
      {(['eat', 'store', 'freeze', 'avoid'] as const).map((v) => (
        <span key={v} className="block rounded-full" style={{ width: size, height: size, background: CAP_COLOURS[v] }} />
      ))}
    </span>
  )
}
