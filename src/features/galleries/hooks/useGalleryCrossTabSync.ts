import { useEffect } from 'react'

import { useGalleryStore } from '@/features/galleries/store/galleryStore'

/**
 * Mantém a aba do staff e o link público sincronizados no modo local
 * (mesmo navegador, abas diferentes).
 */
export function useGalleryCrossTabSync(): void {
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (event.key.startsWith('photoizer.crm.galleries')) {
        void useGalleryStore.persist.rehydrate()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
}
