import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/shared/api/httpClient', () => ({
  http: { get, post },
  apiUrl: (path: string) => `/api/v1${path}`,
}))

import {
  listarGalerias,
  prepararDownloadSelecao,
  urlZipPublico,
} from '@/features/galleries/api/galeriasApi'

describe('urlZipPublico', () => {
  it.each(['editada', 'original'] as const)(
    'monta a URL do ZIP com a versão %s',
    (versao) => {
      expect(urlZipPublico('tok-1', versao)).toBe(
        `/api/v1/public/galerias/tok-1/download-zip?versao=${versao}`,
      )
    },
  )
})

describe('listarGalerias', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('envia o filtro baixada e mapeia a data do ZIP baixado', async () => {
    get.mockResolvedValue({
      itens: [
        {
          id: 'galeria-1',
          agendamentoId: 'ag-1',
          contratoId: null,
          clienteId: null,
          clienteNome: 'Marina',
          status: 'entregue',
          fotosInclusas: 10,
          videosInclusos: 0,
          valorFotoExtra: 50,
          faixasFotoExtra: null,
          totalFotos: 10,
          totalVideos: 0,
          fotosDisponiveis: 10,
          videosDisponiveis: 0,
          rawLiberado: false,
          rawLiberadoEm: null,
          rawLiberadoPor: null,
          zipBaixadoEm: '2026-11-10T12:00:00.000Z',
          capaUrl: null,
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-10T12:00:00.000Z',
        },
      ],
      pagina: 0,
      tamanho: 12,
      totalItens: 1,
      totalPaginas: 1,
      temAnterior: false,
      temProxima: false,
    })

    const pagina = await listarGalerias({ baixada: true, pagina: 0, tamanho: 12 })

    expect(get).toHaveBeenCalledWith('/galerias?baixada=true&pagina=0&tamanho=12')
    expect(pagina.itens[0].zipBaixadoEm).toBe('2026-11-10T12:00:00.000Z')
  })
})

describe('prepararDownloadSelecao', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('solicita o token do ZIP de fotos selecionadas ao backend', async () => {
    const resposta = {
      url: '/public/galerias/downloads/abc/selecao.zip',
      expiraEm: '2026-01-01T00:10:00.000Z',
      quantidade: 3,
    }
    post.mockResolvedValue(resposta)

    await expect(prepararDownloadSelecao('galeria-1')).resolves.toEqual(resposta)
    expect(post).toHaveBeenCalledWith('/galerias/galeria-1/selecao/download')
  })
})
