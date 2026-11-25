import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GaleriaEnsaio, MidiaGaleria } from '@/domain/galleries'

const { mockState, addToast, alterarFinalidade, authState } = vi.hoisted(() => ({
  addToast: vi.fn(),
  alterarFinalidade: vi.fn().mockResolvedValue(undefined),
  mockState: {} as Record<string, unknown>,
  authState: {
    usuario: null as { role: 'admin' | 'gestor' } | null,
  },
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
  useAuthStore: (
    selector: (state: { usuario: { role: 'admin' | 'gestor' } | null }) => unknown,
  ) => selector(authState),
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
    authState.usuario = null
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value() {
        this.setAttribute('open', '')
      },
      configurable: true,
    })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      value() {
        this.removeAttribute('open')
      },
      configurable: true,
    })
    Object.keys(mockState).forEach((key) => delete mockState[key])
    Object.assign(mockState, {
      galeriaAtual: null,
      midias: [],
      carregandoDetalhe: false,
      carregarGaleria: vi.fn().mockResolvedValue(null),
      removeMedia: vi.fn().mockResolvedValue(undefined),
      removeMedias: vi.fn().mockResolvedValue({
        quantidadeRemovida: 2,
        quantidadeIgnorada: 0,
        bytesLiberados: 2048,
      }),
      reprocessarMidia: vi.fn(),
      reprocessarPendentes: vi.fn().mockResolvedValue(2),
      publishSelection: vi.fn(),
      reopenSelection: vi.fn(),
      confirmExtras: vi.fn(),
      waiveExtras: vi.fn(),
      releaseEditing: vi.fn(),
      publishDelivery: vi.fn(),
      revokeDelivery: vi.fn(),
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
        pacoteNome: 'Pacote Promocional',
      },
      midias: [edicao, editada, pronta, liberada, naoSelecionada],
    })

    renderPage()

    expect(screen.getByText(/Pacote Promocional/)).toBeInTheDocument()
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

  it('oferece reprocessamento em lote quando há fotos presas ou com falha', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: [
        midia({
          id: 'foto-falha',
          nomeArquivo: 'falha.jpg',
          numero: 1,
          processamentoStatus: 'falha',
        }),
        midia({
          id: 'foto-processando',
          nomeArquivo: 'processando.jpg',
          numero: 2,
          processamentoStatus: 'processando',
        }),
        midia({ id: 'foto-ok', nomeArquivo: 'ok.jpg', numero: 3 }),
      ],
    })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Reprocessar 2 pendentes' }))

    await waitFor(() => expect(mockState.reprocessarPendentes).toHaveBeenCalledWith('g1'))
    expect(addToast).toHaveBeenCalledWith('2 foto(s) reenfileirada(s) para processamento.')
  })

  it('não mostra o reprocessamento em lote quando não há pendências', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: [midia()],
    })

    renderPage()

    expect(
      screen.queryByRole('button', { name: /Reprocessar .*pendente/i }),
    ).not.toBeInTheDocument()
  })

  it('não oferece o lote enquanto o processamento está dentro do prazo normal', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: [
        midia({
          processamentoStatus: 'processando',
          uploadedAt: new Date().toISOString(),
        }),
      ],
    })

    renderPage()

    expect(
      screen.queryByRole('button', { name: /Reprocessar .*pendente/i }),
    ).not.toBeInTheDocument()
  })

  it('esconde o histórico para o perfil gestor', () => {    authState.usuario = { role: 'gestor' }
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria(),
        links: [],
        historico: [
          {
            id: 'e1',
            tipo: 'criada',
            detalhe: 'Galeria criada para o ensaio.',
            em: '2026-11-13T17:50:00.000Z',
          },
        ],
        pacoteNome: 'Pacote Promocional',
      },
      midias: [],
    })

    renderPage()

    expect(screen.queryByText('Histórico')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Galeria criada para o ensaio/),
    ).not.toBeInTheDocument()
  })

  it('copia o link do cliente pela barra fixa do topo', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({
          status: 'em_selecao',
          tokenGaleria: 'tok-123',
          prazoSelecaoEm: '2026-02-01T00:00:00.000Z',
        }),
        links: [],
        historico: [],
      },
      midias: [],
    })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/galeria/tok-123`,
      ),
    )
    expect(addToast).toHaveBeenCalledWith('Link do cliente copiado.')
  })

  it('copia o link com fallback quando a Clipboard API não existe', async () => {
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
    })
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao', tokenGaleria: 'tok-123' }),
        links: [],
        historico: [],
      },
      midias: [],
    })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }))

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'))
    expect(addToast).toHaveBeenCalledWith('Link do cliente copiado.')
  })

  it('publica a seleção pela barra quando ainda não há link', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: [],
    })

    renderPage()

    const barra = screen.getByLabelText('Link do cliente')
    fireEvent.click(within(barra).getByRole('button', { name: 'Publicar seleção' }))

    expect(mockState.publishSelection).toHaveBeenCalledWith('g1')
  })

  it('posiciona a barra do link antes das mídias', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao', tokenGaleria: 'tok-123' }),
        links: [],
        historico: [],
      },
      midias: [],
    })

    renderPage()

    const barra = screen.getByLabelText('Link do cliente')
    const midias = screen.getByText('Mídias')

    expect(
      barra.compareDocumentPosition(midias) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('limita as fotos no mobile e libera mais sob demanda', () => {
    const fotos = Array.from({ length: 30 }, (_, index) =>
      midia({
        id: `foto-${index}`,
        nomeArquivo: `foto-${index}.jpg`,
        numero: index + 1,
        thumbUrl: 'https://example.test/thumb.jpg',
      }),
    )
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        historico: [],
      },
      midias: fotos,
    })

    renderPage()

    const secao = screen.getByText('Mídias').closest('section') as HTMLElement
    expect(within(secao).getAllByRole('img')).toHaveLength(24)

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais fotos (6 restantes)' }))
    expect(within(secao).getAllByRole('img')).toHaveLength(30)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar menos' }))
    expect(within(secao).getAllByRole('img')).toHaveLength(24)
  })

  it('limita a fila de edição no mobile', () => {
    const fotos = Array.from({ length: 12 }, (_, index) =>
      midia({ id: `foto-${index}`, nomeArquivo: `foto-${index}.jpg`, numero: index + 1 }),
    )
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        selecao: {
          status: 'enviada',
          fotoIds: fotos.map((foto) => foto.id),
          videoIds: [],
          fotosExtras: 0,
          valorExtras: 0,
        },
        historico: [],
      },
      midias: fotos,
    })

    renderPage()

    const fila = screen.getByText('Fila de edição').closest('section') as HTMLElement
    expect(within(fila).getByText(/foto-9\.jpg/)).toBeInTheDocument()
    expect(within(fila).queryByText(/foto-11\.jpg/)).not.toBeInTheDocument()

    fireEvent.click(within(fila).getByRole('button', { name: 'Ver mais (2 restantes)' }))
    expect(within(fila).getByText(/foto-11\.jpg/)).toBeInTheDocument()

    fireEvent.click(within(fila).getByRole('button', { name: 'Mostrar menos' }))
    expect(within(fila).queryByText(/foto-11\.jpg/)).not.toBeInTheDocument()
  })

  it('limita as prontas para baixar no mobile', () => {
    const fotos = Array.from({ length: 12 }, (_, index) =>
      midia({
        id: `foto-${index}`,
        nomeArquivo: `foto-${index}.jpg`,
        numero: index + 1,
        finalidade: 'pronta',
      }),
    )
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao' }),
        links: [],
        selecao: {
          status: 'enviada',
          fotoIds: fotos.map((foto) => foto.id),
          videoIds: [],
          fotosExtras: 0,
          valorExtras: 0,
        },
        historico: [],
      },
      midias: fotos,
    })

    renderPage()

    const prontas = screen
      .getByText('Prontas para baixar')
      .closest('section') as HTMLElement
    expect(within(prontas).queryByText(/foto-11\.jpg/)).not.toBeInTheDocument()

    fireEvent.click(
      within(prontas).getByRole('button', { name: 'Ver mais (2 restantes)' }),
    )
    expect(within(prontas).getByText(/foto-11\.jpg/)).toBeInTheDocument()

    fireEvent.click(within(prontas).getByRole('button', { name: 'Mostrar menos' }))
    expect(within(prontas).queryByText(/foto-11\.jpg/)).not.toBeInTheDocument()
  })

  it('confirma a remoção individual pelo modal', async () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao', videosInclusos: 1 }),
        links: [],
        historico: [],
      },
      midias: [
        midia({
          id: 'video-1',
          tipo: 'video',
          nomeArquivo: 'video.mp4',
          mimeType: 'video/mp4',
          numero: 1,
        }),
      ],
    })

    renderPage()

    fireEvent.click(screen.getByLabelText('Remover video.mp4'))
    expect(screen.getByText('Remover vídeo?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() =>
      expect(mockState.removeMedia).toHaveBeenCalledWith('g1', 'video-1'),
    )
    expect(addToast).toHaveBeenCalledWith('Mídia removida.')
  })

  it('remove todas as fotos com confirmação digitada', async () => {
    const fotos = [
      midia({ id: 'foto-1', nomeArquivo: 'foto-1.jpg', numero: 1 }),
      midia({ id: 'foto-2', nomeArquivo: 'foto-2.jpg', numero: 2 }),
    ]
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao', videosInclusos: 1 }),
        links: [],
        historico: [],
      },
      midias: fotos,
    })

    renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: 'Remover todas as fotos (2)' }),
    )
    expect(screen.getByText('Remover todas as fotos?')).toBeInTheDocument()

    const confirmar = screen.getByRole('button', { name: 'Remover 2 foto(s)' })
    expect(confirmar).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'REMOVER' } })
    expect(confirmar).not.toBeDisabled()
    fireEvent.click(confirmar)

    await waitFor(() =>
      expect(mockState.removeMedias).toHaveBeenCalledWith('g1', ['foto-1', 'foto-2']),
    )
    expect(addToast).toHaveBeenCalledWith('2 foto(s) removida(s) (2 KB liberados).')
  })

  it('desabilita o envio de vídeo quando a galeria não tem vídeo incluso', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_selecao', videosInclusos: 0 }),
        links: [],
        historico: [],
      },
      midias: [midia()],
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Enviar vídeo' })).toBeDisabled()
    expect(
      screen.getByText(/Esta galeria não tem vídeo incluso/),
    ).toBeInTheDocument()
  })

  it('não mostra remoção em lote fora dos status editáveis', () => {
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria({ status: 'em_edicao' }),
        links: [],
        historico: [],
      },
      midias: [midia()],
    })

    renderPage()

    expect(
      screen.queryByRole('button', { name: /Remover todas as fotos/ }),
    ).not.toBeInTheDocument()
  })

  it('mostra o histórico para o perfil admin', () => {
    authState.usuario = { role: 'admin' }
    Object.assign(mockState, {
      galeriaAtual: {
        galeria: galeria(),
        links: [],
        historico: [
          {
            id: 'e1',
            tipo: 'criada',
            detalhe: 'Galeria criada para o ensaio.',
            em: '2026-11-13T17:50:00.000Z',
          },
        ],
        pacoteNome: 'Pacote Promocional',
      },
      midias: [],
    })

    renderPage()

    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(
      screen.getByText(/Galeria criada para o ensaio/),
    ).toBeInTheDocument()
  })
})
