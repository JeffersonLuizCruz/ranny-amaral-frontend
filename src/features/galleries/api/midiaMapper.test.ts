import { describe, expect, it } from 'vitest'

import { toMidia } from '@/features/galleries/api/midiaMapper'

describe('toMidia', () => {
  it('mapeia URLs e status de processamento', () => {
    const midia = toMidia({
      id: 'mid-1',
      tipo: 'foto',
      nomeOriginal: 'foto.jpg',
      mimeType: 'image/jpeg',
      tamanho: 1024,
      largura: 1200,
      altura: 800,
      duracaoSegundos: null,
      ordem: 1,
      status: 'disponivel',
      erroProcessamento: null,
      thumbUrl: 'https://storage/thumb.jpg',
      webUrl: 'https://storage/web.jpg',
      originalUrl: null,
      editadaUrl: null,
      createdAt: '2026-11-06T10:00:00Z',
    })

    expect(midia.id).toBe('mid-1')
    expect(midia.tipo).toBe('foto')
    expect(midia.thumbUrl).toBe('https://storage/thumb.jpg')
    expect(midia.processamentoStatus).toBe('disponivel')
    expect(midia.status).toBe('original')
  })
})
