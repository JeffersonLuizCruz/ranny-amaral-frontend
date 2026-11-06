import type { MidiaTipo } from '@/domain/galleries'

export const MAX_FOTO_SIZE = 50 * 1024 * 1024
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'

const FOTO_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])

export function mediaTipoFromFile(file: File): MidiaTipo {
  return VIDEO_TYPES.has(file.type) ? 'video' : 'foto'
}

export function validateMediaFile(file: File): string | null {
  if (file.size <= 0) return 'O arquivo está vazio.'
  if (FOTO_TYPES.has(file.type)) {
    if (file.size > MAX_FOTO_SIZE) return 'A foto deve ter no máximo 50 MB.'
    return null
  }
  if (VIDEO_TYPES.has(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) return 'O vídeo deve ter no máximo 500 MB.'
    return null
  }
  return 'Envie fotos JPEG/PNG/WebP ou vídeos MP4/MOV.'
}
