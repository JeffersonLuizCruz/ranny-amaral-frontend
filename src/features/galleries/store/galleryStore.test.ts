import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import type { Pagina } from '@/shared/api/types'

const { listarMidias, buscarGaleria, enviarVersaoEditada } = vi.hoisted(() => ({
  listarMidias: vi.fn(),
  buscarGaleria: vi.fn(),
  enviarVersaoEditada: vi.fn(),
}))

vi.mock('@/features/galleries/api/galeriasApi', () => ({
  atualizarGaleriaNaLista: (_galerias: unknown[], atualizada: unknown) => [atualizada],
  buscarGaleria,
  confirmarExtras: vi.fn(),
  criarGaleria: vi.fn(),
  isentarExtras: vi.fn(),
  liberarEdicao: vi.fn(),
  listarGalerias: vi.fn(),
  listarMidias,
  publicarEntrega: vi.fn(),
  publicarSelecao: vi.fn(),
  reabrirSelecao: vi.fn(),
  removerMidia: vi.fn(),
  revogarEntrega: vi.fn(),
}))

vi.mock('@/features/galleries/api/galeriaUploadApi', () => ({
  enviarMidia: vi.fn(),
  enviarVersaoEditada,
  removerVersaoEditada: vi.fn(),
}))

import { useGalleryStore } from '@/features/galleries/store/galleryStore'

function midia(id: string): MidiaGaleria {
  return {
    id,
    tipo: 'foto',
    nomeArquivo: `${id}.jpg`,
    mimeType: 'image/jpeg',
    tamanho: 1,
    status: 'original',
    finalidade: 'edicao',
    numero: 1,
    uploadedAt: '2026-01-01T00:00:00.000Z',
  }
}

function pagina(
  itens: MidiaGaleria[],
  paginaAtual: number,
  totalPaginas: number,
): Pagina<MidiaGaleria> {
  return {
    itens,
    pagina: paginaAtual,
    tamanho: 100,
    totalItens: totalPaginas * 100,
    totalPaginas,
    temAnterior: paginaAtual > 0,
    temProxima: paginaAtual < totalPaginas - 1,
  }
}

describe('galleryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useGalleryStore.setState({
      galerias: [],
      paginaGalerias: null,
      galeriaAtual: null,
      midias: [],
      carregando: false,
      carregandoDetalhe: false,
      erro: null,
    })
  })

  it('carrega todas as páginas de mídias respeitando o limite de 100', async () => {
    buscarGaleria.mockResolvedValue({
      galeria: {
        id: 'g1',
        agendamentoId: 'a1',
        status: 'em_selecao',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      links: [],
      historico: [],
    })
    listarMidias
      .mockResolvedValueOnce(pagina([midia('m1'), midia('m2')], 0, 2))
      .mockResolvedValueOnce(pagina([midia('m3')], 1, 2))

    await useGalleryStore.getState().carregarGaleria('g1')

    expect(listarMidias).toHaveBeenNthCalledWith(1, 'g1', 0, 100)
    expect(listarMidias).toHaveBeenNthCalledWith(2, 'g1', 1, 100)
    expect(useGalleryStore.getState().midias.map((item) => item.id)).toEqual([
      'm1',
      'm2',
      'm3',
    ])
  })

  it('envia várias versões editadas e recarrega a galeria uma única vez', async () => {
    buscarGaleria.mockResolvedValue({
      galeria: {
        id: 'g1',
        agendamentoId: 'a1',
        status: 'em_edicao',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      links: [],
      historico: [],
    })
    listarMidias.mockResolvedValue(pagina([], 0, 0))
    enviarVersaoEditada.mockImplementation((_galeriaId: string, midiaId: string) =>
      Promise.resolve({ ...midia(midiaId), editadaDisponivel: true }),
    )

    const itens = ['m1', 'm2', 'm3'].map((midiaId) => ({
      midiaId,
      file: new File(['x'], `${midiaId}.jpg`, { type: 'image/jpeg' }),
    }))

    const resultados = await useGalleryStore
      .getState()
      .uploadVersoesEditadas('g1', itens)

    expect(enviarVersaoEditada).toHaveBeenCalledTimes(3)
    expect(resultados.every((resultado) => resultado.ok)).toBe(true)
    expect(listarMidias).toHaveBeenCalledTimes(1)
  })

  it('continua o lote quando uma versão falha', async () => {
    buscarGaleria.mockResolvedValue({
      galeria: {
        id: 'g1',
        agendamentoId: 'a1',
        status: 'em_edicao',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      links: [],
      historico: [],
    })
    listarMidias.mockResolvedValue(pagina([], 0, 0))
    enviarVersaoEditada
      .mockRejectedValueOnce(new Error('falha no upload'))
      .mockImplementation((_galeriaId: string, midiaId: string) =>
        Promise.resolve({ ...midia(midiaId), editadaDisponivel: true }),
      )

    const itens = ['m1', 'm2'].map((midiaId) => ({
      midiaId,
      file: new File(['x'], `${midiaId}.jpg`, { type: 'image/jpeg' }),
    }))

    const resultados = await useGalleryStore
      .getState()
      .uploadVersoesEditadas('g1', itens)

    expect(resultados.filter((resultado) => resultado.ok)).toHaveLength(1)
    expect(resultados.filter((resultado) => !resultado.ok)).toHaveLength(1)
  })
})
