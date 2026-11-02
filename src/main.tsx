import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/doto/700.css'
import '@fontsource/doto/900.css'
import '@fontsource-variable/dm-sans'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline helper and home-screen install (not in local development).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    navigator.serviceWorker.ready.then(saveForOffline).catch(() => {})
  })
}

/**
 * Saves everything the app needs to work offline: the files this page has
 * loaded, plus the label reader and barcode reader, which otherwise only
 * download on first use. Skipped when the phone asks to save data.
 */
async function saveForOffline() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const cache = await caches.open('esfa-v1')
  const loaded = performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((u) => u.startsWith(location.origin))
  await Promise.allSettled(loaded.map((u) => cache.add(u)))
  if (conn?.saveData) return
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 5000 }) : setTimeout(fn, 3000))
  idle(() => {
    // Starting the readers downloads (and so caches) the right files for this phone.
    import('./lib/ocr').then((m) => m.warmUp()).catch(() => {})
    import('./lib/barcode').then((m) => m.warmUp()).catch(() => {})
  })
}
