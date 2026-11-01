import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/doto/700.css'
import '@fontsource/doto/900.css'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline helper and home-screen install (not in local development).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
