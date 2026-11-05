import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import type { GalleryPort, GalleryResult } from '@/integrations/gallery/types'

function appOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export const localGalleryAdapter: GalleryPort = {
  enabled: true,
  mode: 'local',

  async createGallery(appointmentId): Promise<GalleryResult | null> {
    const galeria = useGalleryStore.getState().createGallery(appointmentId)
    if (!galeria) return null

    return {
      url: `${appOrigin()}/galerias/${galeria.id}`,
    }
  },

  buildSelectionUrl(token) {
    return `${appOrigin()}/selecao/${token}`
  },

  buildDeliveryUrl(token) {
    return `${appOrigin()}/entrega/${token}`
  },
}
