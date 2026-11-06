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
      editadaDisponivel: false,
      editadaProcessando: false,
      createdAt: '2026-11-06T10:00:00Z',
    })

    expect(midia.id).toBe('mid-1')
    expect(midia.tipo).toBe('foto')
    expect(midia.thumbUrl).toBe('https://storage/thumb.jpg')
    expect(midia.processamentoStatus).toBe('disponivel')
    expect(midia.status).toBe('original')
    expect(midia.editadaDisponivel).toBe(false)
  })

  it('marca a mídia como editada quando a versão final existe', () => {
    const midia = toMidia({
      id: 'mid-2',
      tipo: 'foto',
      nomeOriginal: 'foto-editada.jpg',
      mimeType: 'image/jpeg',
      tamanho: 2048,
      largura: 1200,
      altura: 800,
      duracaoSegundos: null,
      ordem: 1,
      status: 'disponivel',
      erroProcessamento: null,
      thumbUrl: 'https://storage/thumb-editada.jpg',
      webUrl: 'https://storage/web-editada.jpg',
      originalUrl: null,
      editadaUrl: 'https://storage/editada.jpg',
      editadaDisponivel: true,
      editadaProcessando: true,
      createdAt: '2026-11-06T10:00:00Z',
    })

    expect(midia.status).toBe('editada')
    expect(midia.editadaUrl).toBe('https://storage/editada.jpg')
    expect(midia.editadaDisponivel).toBe(true)
  })
})
