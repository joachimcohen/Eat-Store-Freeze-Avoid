// Small settings kept on this phone only. If storage is blocked (private
// browsing), everything still works; the settings just aren't remembered.
const KEYS = { disclaimer: 'esfa.disclaimerOk', hideFacts: 'esfa.hideFacts' } as const

function get(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function set(key: string, value: string | null) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* fine */ }
}

export const prefs = {
  // Version 2: the stronger "guidance, not advice" wording. Everyone who
  // accepted the old one sees the new one once.
  disclaimerAccepted: () => get(KEYS.disclaimer) === '2',
  acceptDisclaimer: () => set(KEYS.disclaimer, '2'),
  factsHidden: () => get(KEYS.hideFacts) === '1',
  setFactsHidden: (hidden: boolean) => set(KEYS.hideFacts, hidden ? '1' : null),
}
