import { useEffect } from 'react'

import { useGalleryStore } from '@/features/galleries/store/galleryStore'

/**
 * Atualiza a lista de galerias quando a aba volta ao foco.
 *
 * O backend é a fonte de verdade; não há mais sincronização por localStorage.
 */
export function useGalleryCrossTabSync(): void {
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void useGalleryStore.getState().carregarGalerias().catch(() => undefined)
      }
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
}
