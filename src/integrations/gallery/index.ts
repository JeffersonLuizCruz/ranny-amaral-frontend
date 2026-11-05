import { httpGalleryAdapter } from './httpAdapter'
import { localGalleryAdapter } from './localAdapter'
import type { GalleryPort } from './types'

const mode = import.meta.env.VITE_GALLERY_ADAPTER as string | undefined

/**
 * Mock local por padrão. Troque `VITE_GALLERY_ADAPTER=http` quando o backend existir.
 */
export const galleryIntegration: GalleryPort =
  mode === 'http' ? httpGalleryAdapter : localGalleryAdapter

export type { GalleryPort, GalleryResult } from './types'
