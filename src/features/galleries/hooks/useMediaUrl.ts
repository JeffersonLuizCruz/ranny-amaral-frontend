import { useEffect, useState } from 'react'

import { getGalleryMedia } from '@/integrations/gallery/mediaStorage'

export function useMediaUrl(arquivoKey?: string, enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!arquivoKey || !enabled) {
      // oxlint-disable-next-line react/set-state-in-effect
      setUrl(null)
      return
    }

    let active = true
    let objectUrl: string | null = null

    getGalleryMedia(arquivoKey)
      .then((blob) => {
        if (!active || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (active) setUrl(null)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [arquivoKey, enabled])

  return url
}
