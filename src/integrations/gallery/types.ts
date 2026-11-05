export interface GalleryResult {
  url: string
}

export interface GalleryPort {
  readonly enabled: boolean
  readonly mode: 'local' | 'remote'
  createGallery(appointmentId: string): Promise<GalleryResult | null>
  buildSelectionUrl(token: string): string
  buildDeliveryUrl(token: string): string
}
