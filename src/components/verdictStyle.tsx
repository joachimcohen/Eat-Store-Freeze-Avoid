import type { Verdict } from '../rules/types'

export const VERDICT_ICONS: Record<Verdict, string> = { eat: '✓', store: '■', freeze: '❄', avoid: '✕', 'no-info': '?' }
export const VERDICT_COLOURS: Record<Verdict, string> = {
  eat: 'text-eat bg-eat-bg border-eat',
  store: 'text-store bg-store-bg border-store',
  freeze: 'text-freeze bg-freeze-bg border-freeze',
  avoid: 'text-avoid bg-avoid-bg border-avoid',
  'no-info': 'text-noinfo bg-noinfo-bg border-noinfo',
}
/** Cap colour for each verdict (the bottle cap changes on the result). */
export const CAP_COLOURS: Record<Verdict | 'default', string> = {
  default: '#f4f6fb',
  eat: '#1f9a4f',
  store: '#f0a020',
  freeze: '#2f86e8',
  avoid: '#d93a2f',
  'no-info': '#8a93a3',
}

export function VerdictSticker({ verdict, label, size = 'lg' }: { verdict: Verdict; label: string; size?: 'lg' | 'sm' }) {
  const big = size === 'lg'
  return (
    <span className={`sticker pop inline-flex items-center gap-3 rounded-2xl border-[3px] ${big ? 'px-5 py-3' : 'px-3 py-1.5'} ${VERDICT_COLOURS[verdict]}`}>
      <span aria-hidden="true" className={`grid place-items-center rounded-full bg-current ${big ? 'size-11 text-2xl' : 'size-7 text-base'}`}>
        <span className="text-white">{VERDICT_ICONS[verdict]}</span>
      </span>
      <span className={`display font-bold ${big ? 'text-5xl' : 'text-2xl'}`}>{label}</span>
    </span>
  )
}
