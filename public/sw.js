// Offline helper. Always tries the network first, so you see the newest
// version while prototyping; falls back to the saved copy when offline.
// Only this app's own files are saved. Nothing is sent anywhere.
const CACHE = 'esfa-v1'
// Note: ignoreVary, because saved files were fetched without the Origin header that module scripts send.

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      })
      .catch(() => caches.match(e.request, { ignoreVary: true }).then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('/', { ignoreVary: true }) : Response.error()))),
  )
})
