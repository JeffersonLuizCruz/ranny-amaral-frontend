/*
 * Photoizer CRM — service worker
 *
 * Strategy:
 *  - Navigation requests: network-first, falling back to the cached shell or
 *    the offline page. Keeps the app usable without a connection.
 *  - Static same-origin assets: stale-while-revalidate.
 *
 * Bump CACHE_VERSION whenever the shell changes.
 */
const CACHE_VERSION = 'photoizer-crm-v2'

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION)

      try {
        await cache.addAll(APP_SHELL)
      } catch (error) {
        console.warn('[sw] Falha ao pré-cachear o app shell.', error)
      }

      // Vite emits hashed assets; read the shell to discover and cache them
      // so the app also opens offline right after the very first visit.
      try {
        const shell = (await cache.match('/index.html')) || (await fetch('/index.html'))
        if (!shell) return

        const html = await shell.text()
        const assetUrls = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)).map(
          (match) => match[1],
        )

        await Promise.all(
          assetUrls.map(async (url) => {
            if (!url) return
            try {
              const response = await fetch(url)
              if (!response.ok) return

              // Vite's preview server adds `Vary: Origin`, which makes a
              // URL-keyed cache entry miss module-script requests. The asset
              // is static, so the Vary header can safely be dropped.
              const headers = new Headers(response.headers)
              headers.delete('Vary')
              const body = await response.blob()

              await cache.put(
                url,
                new Response(body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers,
                }),
              )
            } catch {
              // A failed asset must not block the service worker install.
            }
          }),
        )
      } catch (error) {
        console.warn('[sw] Falha ao pré-cachear assets do build.', error)
      }
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached

          const shell = await caches.match('/index.html')
          if (shell) return shell

          return caches.match('/offline.html')
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)

      return cached || network
    }),
  )
})
