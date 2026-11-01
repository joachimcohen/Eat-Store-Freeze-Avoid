import type { Verdict } from '../rules/types'

export const VERDICT_ICONS: Record<Verdict, string> = { eat: '✓', store: '■', freeze: '❄', avoid: '✕', 'no-info': '?' }
export const VERDICT_COLOURS: Record<Verdict, string> = {
  eat: 'text-eat bg-eat-bg border-eat',
  store: 'text-store bg-store-bg border-store',
  freeze: 'text-freeze bg-freeze-bg border-freeze',
  avoid: 'text-avoid bg-avoid-bg border-avoid',
  'no-info': 'text-noinfo bg-noinfo-bg border-noinfo',
}
