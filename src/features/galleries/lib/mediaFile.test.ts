import { describe, expect, it } from 'vitest'

import {
  mediaTipoFromFile,
  validateMediaFile,
} from '@/features/galleries/lib/mediaFile'

function arquivo(tamanho: number, tipo: string): File {
  return { size: tamanho, type: tipo } as File
}

describe('mediaFile', () => {
  it('identifica foto e vídeo', () => {
    expect(mediaTipoFromFile(arquivo(10, 'image/jpeg'))).toBe('foto')
    expect(mediaTipoFromFile(arquivo(10, 'video/mp4'))).toBe('video')
  })

  it('aceita foto até 50 MB', () => {
    expect(validateMediaFile(arquivo(50 * 1024 * 1024, 'image/jpeg'))).toBeNull()
  })

  it('rejeita foto acima de 50 MB', () => {
    expect(validateMediaFile(arquivo(50 * 1024 * 1024 + 1, 'image/jpeg'))).toContain(
      '50 MB',
    )
  })

  it('rejeita vídeo acima de 500 MB sem alocar o arquivo inteiro', () => {
    expect(validateMediaFile(arquivo(500 * 1024 * 1024 + 1, 'video/mp4'))).toContain(
      '500 MB',
    )
  })

  it('rejeita tipo desconhecido', () => {
    expect(validateMediaFile(arquivo(10, 'application/zip'))).toContain('JPEG')
  })
})
