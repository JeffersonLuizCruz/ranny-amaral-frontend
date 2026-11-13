import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GaleriaEnsaio, MidiaGaleria } from '@/domain/galleries'

const { mockState, addToast, alterarFinalidade } = vi.hoisted(() => ({
  addToast: vi.fn(),
  alterarFinalidade: vi.fn().mockResolvedValue(undefined),
  mockState: {} as Record<string, unknown>,
}))

vi.mock('@/features/galleries/store/galleryStore', () => ({
  useGalleryStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockState),
}))

vi.mock('@/shared/store/toastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToast }) => unknown) =>
    selector({ addToast }),
}))

vi.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { usuario: null }) => unknown) =>
    selector({ usuario: null }),
}))

vi.mock('@/features/galleries/api/galeriasApi', () => ({
  prepararDownloadSelecao: vi.fn(),
}))

import { GalleryDetailPage } from '@/features/galleries/components/GalleryDetailPage'

function midia(overrides: Partial<MidiaGaleria> = {}): MidiaGaleria {
  return {
    id: 'm1',
    tipo: 'foto',
    nomeArquivo: 'foto.jpg',
    mimeType: 'image/jpeg',
    tamanho: 100,
    status: 'original',
    finalidade: 'edicao',
    numero: 1,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    processamentoStatus: 'disponivel',
    ...overrides,
  }
}

function galeria(overrides: Partial<GaleriaEnsaio> = {}): GaleriaEnsaio {
  return {
    id: 'g1',
    agendamentoId: 'a1',
    status: 'em_edicao',
    fotosInclusas: 3,
    videosInclusos: 0,
    valorFotoExtra: 50,
    midias: [],
    historico: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/galerias/g1']}>
      <Routes>
        <Route path="/galerias/:galeriaId" element={<GalleryDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GalleryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockState).forEach((key) => delete mockState[key])
    Object.assign(mockState, {
      galeriaAtual: null,
      midias: [],
      carregandoDetalhe: false,
      carregarGaleria: vi.fn().mockResolvedValue(null),
      removeMedia: vi.fn(),
      publishSelection: vi.fn(),
      reopenSelection: vi.fn(),
      confirmExtras: vi.fn(),
      waiveExtras: vi.fn(),
      releaseEditing: vi.fn(),
      publishDelivery: vi.fn(),
      revokeDelivery: vi.fn(),
      releaseRaw: vi.fn(),
      revokeRaw: vi.fn(),
      liberarProntas: vi.fn(),
      liberarLote: vi.fn(),
      revogarLiberacao: vi.fn(),
      renovarLink: vi.fn(),
      definirAutoLiberacao: vi.fn(),
      alterarFinalidade,
      uploadMidia: vi.fn(),
    })
  })

  it('separa fila de edição, prontas, liberadas e filtra o grid', () => {
    const edicao = midia({
      id: 'foto-edicao',
      nomeArquivo: 'foto-edicao.jpg',
      numero: 1,
    })
    const editada = midia({
      id: 'foto-editada',
      nomeArquivo: 'foto-editada.jpg',
      numero: 2,
      editadaDisponivel: true,
    })
    const pronta = midia({
      id: 'foto-pronta',
      nomeArquivo: 'foto-pronta.jpg',
      numero: 3,
      finalidade: 'pronta',
    })
    const liberada = midia({
      id: 'foto-liberada',
      nomeArquivo: 'foto-liberada.jpg',
      numero: 4,
      finalidade: 'pronta',
      liberadaEm: '2026-01-02T00:00:00.000Z',
    })
    const naoSelecionada = midia({
      id: 'foto-fora',
      nomeArquivo: 'foto-fora.jpg',
      numero: 5,
    })

    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria(),
        links: [],
        selecao: {
          status: 'enviada',
          fotoIds: ['foto-edicao', 'foto-editada', 'foto-pronta', 'foto-liberada'],
          videoIds: [],
          fotosExtras: 1,
          valorExtras: 50,
          enviadaEm: '2026-01-01T00:00:00.000Z',
        },
        historico: [],
      },
      midias: [edicao, editada, pronta, liberada, naoSelecionada],
    })

    renderPage()

    expect(screen.getByText('Fila de edição')).toBeInTheDocument()
    expect(screen.getByText('1 aguardando edição · 3 de 4 fotos prontas')).toBeInTheDocument()
    expect(screen.getByText('Prontas para baixar')).toBeInTheDocument()
    expect(screen.getByText('3 pronta(s) · 1 liberada(s) · 2 aguardando liberação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar editadas em lote (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liberar prontas (2)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas (5)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    expect(screen.queryByLabelText('Editar versão de foto-pronta.jpg')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Editar versão de foto-editada.jpg')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Prontas (3)' }))
    expect(screen.queryByText('foto-fora.jpg')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Para edição (2)' }))
    expect(screen.getByText('foto-fora.jpg')).toBeInTheDocument()
  })

  it('permite corrigir a finalidade antes da seleção', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: [
        midia({ id: 'foto-edicao', nomeArquivo: 'foto-edicao.jpg', numero: 1 }),
      ],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    fireEvent.click(screen.getByLabelText('Alterar finalidade de foto-edicao.jpg'))

    expect(alterarFinalidade).toHaveBeenCalledWith('g1', 'foto-edicao', 'pronta')
  })
})
