const CACHE_NAME = 'ueemt-v2'
const STATIC_ASSETS = [
  '/',
  '/activites',
  '/membres',
  '/a-propos',
  '/connexion',
  '/offline.html',
  '/logo.jpeg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // API calls (Supabase, Next.js route handlers) → network only, fallback JSON
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/auth/')
  ) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ offline: true, error: 'Vous êtes hors ligne.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Dynamic pages (feed, profil, dashboard) → network first, no cache fallback
  if (
    url.pathname.startsWith('/feed') ||
    url.pathname.startsWith('/profil') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/recensement')
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Static pages → cache first, then network, then offline page
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
          }
          return response
        })
        .catch(() => caches.match('/offline.html'))
    })
  )
})
