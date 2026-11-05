import {
  GALLERY_MEDIA_STORE,
  withStore,
} from '@/integrations/storage/indexedDb'

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024

export interface StoredMedia {
  arquivoKey: string
  nomeArquivo: string
  mimeType: string
  tamanho: number
  enviadoEm: string
}

interface MediaRecord extends StoredMedia {
  blob: Blob
}

function createMediaKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `media-${crypto.randomUUID()}`
  }
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function saveGalleryMedia(file: File): Promise<StoredMedia> {
  const key = createMediaKey()
  const enviadoEm = new Date().toISOString()
  const record: MediaRecord = {
    blob: file,
    arquivoKey: key,
    nomeArquivo: file.name,
    mimeType: file.type || 'application/octet-stream',
    tamanho: file.size,
    enviadoEm,
  }

  await withStore(GALLERY_MEDIA_STORE, 'readwrite', (store) =>
    store.put(record, key),
  )

  return {
    arquivoKey: key,
    nomeArquivo: file.name,
    mimeType: record.mimeType,
    tamanho: file.size,
    enviadoEm,
  }
}

export async function getGalleryMedia(key: string): Promise<Blob | null> {
  const record = await withStore<MediaRecord | undefined>(
    GALLERY_MEDIA_STORE,
    'readonly',
    (store) => store.get(key),
  )
  return record?.blob ?? null
}

export async function removeGalleryMedia(key: string): Promise<void> {
  await withStore(GALLERY_MEDIA_STORE, 'readwrite', (store) =>
    store.delete(key),
  )
}

export function validateMediaFile(file: File): string | null {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (!isImage && !isVideo) {
    return 'Envie apenas imagens ou vídeos.'
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return 'Cada foto deve ter no máximo 30 MB.'
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return 'Cada vídeo deve ter no máximo 500 MB.'
  }

  return null
}

export function mediaTipoFromFile(file: File): 'foto' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'foto'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
