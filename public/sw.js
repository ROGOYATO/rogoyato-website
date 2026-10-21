// Keeps images, built assets and fonts in the browser so repeat visits
// load them from disk instead of the network. GitHub Pages only allows
// a 10 minute HTTP cache, so this is where longer caching happens.
// Pages themselves (HTML) are never cached here and always come fresh.
const CACHE = 'rogoyato-v1'
const IMAGE_PATH = /\.(?:webp|png|jpe?g|gif|svg|ico)$/i

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key.startsWith('rogoyato-') && key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }
  const response = await fetch(request)
  if (response.ok) {
    cache.put(request, response.clone())
  }
  return response
}

// Answer from the cache right away, then refresh the cached copy in the
// background so a replaced photo shows up on the next visit.
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const network = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })
  if (cached) {
    event.waitUntil(network.catch(() => undefined))
    return cached
  }
  return network
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    // Vite puts a content hash in every file name under /assets/, so a
    // cached copy can never be stale.
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(cacheFirst(request))
    } else if (IMAGE_PATH.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, event))
    }
    return
  }

  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request))
  } else if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, event))
  }
})
