import { describe, expect, it } from 'vitest'

import {
  FOTO_ACCEPT,
  VIDEO_ACCEPT,
  mediaTipoFromFile,
  validateEditedFile,
  validateFotoFile,
  validateMediaFile,
  validateVideoFile,
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

  it('separa os accepts de foto e vídeo', () => {
    expect(FOTO_ACCEPT).not.toContain('video/')
    expect(VIDEO_ACCEPT).not.toContain('image/')
  })

  it('aceita vídeo MP4/MOV até 500 MB', () => {
    expect(validateVideoFile(arquivo(500 * 1024 * 1024, 'video/mp4'))).toBeNull()
    expect(validateVideoFile(arquivo(10, 'video/quicktime'))).toBeNull()
  })

  it('rejeita vídeo inválido e imagem no envio de vídeo', () => {
    expect(validateVideoFile(arquivo(10, 'image/jpeg'))).toContain('MP4')
    expect(validateVideoFile(arquivo(500 * 1024 * 1024 + 1, 'video/mp4'))).toContain(
      '500 MB',
    )
  })

  it('rejeita vídeo no envio de fotos', () => {
    expect(validateFotoFile(arquivo(10, 'video/mp4'))).toContain('JPEG')
  })

  it.each(['image/jpeg', 'image/png', 'image/webp'])(
    'aceita versão editada em %s',
    (tipo) => {
      expect(validateEditedFile(arquivo(10, tipo))).toBeNull()
    },
  )

  it.each([
    ['application/pdf', 1024, 'JPEG'],
    ['image/jpeg', 0, 'vazio'],
    ['image/jpeg', 50 * 1024 * 1024 + 1, '50 MB'],
  ])('rejeita versão editada %s (%i bytes)', (tipo, tamanho, mensagem) => {
    expect(validateEditedFile(arquivo(tamanho as number, tipo as string))).toContain(
      mensagem as string,
    )
  })
})
