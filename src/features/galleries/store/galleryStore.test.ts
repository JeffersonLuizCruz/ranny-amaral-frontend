import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import type { Pagina } from '@/shared/api/types'

const { listarMidias, buscarGaleria } = vi.hoisted(() => ({
  listarMidias: vi.fn(),
  buscarGaleria: vi.fn(),
}))

vi.mock('@/features/galleries/api/galeriasApi', () => ({
  atualizarGaleriaNaLista: (_galerias: unknown[], atualizada: unknown) => [atualizada],
  buscarGaleria,
  confirmarExtras: vi.fn(),
  criarGaleria: vi.fn(),
  iniciarEdicao: vi.fn(),
  isentarExtras: vi.fn(),
  liberarEdicao: vi.fn(),
  liberarRaw: vi.fn(),
  listarGalerias: vi.fn(),
  listarMidias,
  marcarProntaEntrega: vi.fn(),
  publicarEntrega: vi.fn(),
  publicarSelecao: vi.fn(),
  reabrirSelecao: vi.fn(),
  removerMidia: vi.fn(),
  revogarEntrega: vi.fn(),
  revogarRaw: vi.fn(),
}))

vi.mock('@/features/galleries/api/galeriaUploadApi', () => ({
  enviarMidia: vi.fn(),
  enviarVersaoEditada: vi.fn(),
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
})
