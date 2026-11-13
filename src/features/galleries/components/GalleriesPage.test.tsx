import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockState, carregarGalerias } = vi.hoisted(() => ({
  carregarGalerias: vi.fn().mockResolvedValue(undefined),
  mockState: {} as Record<string, unknown>,
}))

vi.mock('@/features/galleries/store/galleryStore', () => ({
  useGalleryStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockState),
}))

import { GalleriesPage } from '@/features/galleries/components/GalleriesPage'

const galeria = {
  id: 'g1',
  agendamentoId: 'a1',
  clienteNome: 'Mariana Silva',
  status: 'em_edicao',
  fotosInclusas: 20,
  videosInclusos: 0,
  valorFotoExtra: 50,
  totalFotos: 20,
  totalVideos: 0,
  fotosDisponiveis: 20,
  videosDisponiveis: 0,
  fotosSelecionadas: 20,
  fotosProntas: 8,
  fotosLiberadas: 5,
  rawLiberado: false,
  midias: [],
  historico: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const pagina = {
  itens: [galeria],
  pagina: 0,
  tamanho: 12,
  totalItens: 1,
  totalPaginas: 1,
  temAnterior: false,
  temProxima: false,
}

describe('GalleriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockState).forEach((key) => delete mockState[key])
    Object.assign(mockState, {
      galerias: [galeria],
      paginaGalerias: pagina,
      carregando: false,
      erro: null,
      carregarGalerias,
    })
  })

  it('mostra o progresso de edição e liberação no card', () => {
    render(
      <MemoryRouter>
        <GalleriesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Mariana Silva')).toBeInTheDocument()
    expect(screen.getByText('8/20')).toBeInTheDocument()
    expect(screen.getByText(/5 liberadas/)).toBeInTheDocument()
    expect(carregarGalerias).toHaveBeenCalled()
  })
})
