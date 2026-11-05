/**
 * Service worker registration + update flow.
 *
 * Registration only runs in production builds: caching Vite's dev modules
 * produces confusing stale states during development.
 */

let registrationStarted = false

export function registerServiceWorker(
  onUpdateReady: (applyUpdate: () => void) => void,
): void {
  if (
    !import.meta.env.PROD ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return
  }

  if (registrationStarted) return
  registrationStarted = true

  const start = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const notifyIfWaiting = () => {
          if (registration.waiting) {
            onUpdateReady(() => applyUpdate(registration))
          }
        }

        notifyIfWaiting()

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return

          installing.addEventListener('statechange', () => {
            if (installing.state !== 'installed') return
            if (!navigator.serviceWorker.controller) return
            onUpdateReady(() => applyUpdate(registration))
          })
        })

        // Check for updates when the app regains focus.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => undefined)
          }
        })
      })
      .catch((error) => {
        console.warn('[pwa] Não foi possível registrar o service worker.', error)
      })
  }

  if (document.readyState === 'complete') {
    start()
  } else {
    window.addEventListener('load', start, { once: true })
  }
}

function applyUpdate(registration: ServiceWorkerRegistration): void {
  const waiting = registration.waiting

  if (!waiting) {
    window.location.reload()
    return
  }

  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  waiting.postMessage({ type: 'SKIP_WAITING' })
}
