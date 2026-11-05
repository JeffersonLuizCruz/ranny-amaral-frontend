import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(available: boolean) => void>()

function notify() {
  listeners.forEach((listener) => listener(Boolean(deferredPrompt)))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredPrompt))
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const listener = (available: boolean) => setCanInstall(available)
    listeners.add(listener)
    listener(Boolean(deferredPrompt))

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        deferredPrompt = null
        notify()
        return true
      }
      return false
    } finally {
      setInstalling(false)
    }
  }, [])

  return { canInstall, installing, install }
}
