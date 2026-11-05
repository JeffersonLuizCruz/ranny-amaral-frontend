import type { GalleryPort } from '@/integrations/gallery/types'

/**
 * Placeholder para o backend real. Mantém a mesma interface do adapter local.
 */
export const httpGalleryAdapter: GalleryPort = {
  enabled: false,
  mode: 'remote',

  async createGallery() {
    throw new Error('Integração de galeria com o backend ainda não configurada.')
  },

  buildSelectionUrl(token) {
    return `/selecao/${token}`
  },

  buildDeliveryUrl(token) {
    return `/entrega/${token}`
  },
}
