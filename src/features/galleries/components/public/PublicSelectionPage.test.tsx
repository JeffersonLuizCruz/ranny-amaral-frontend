import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { consultarGaleriaPublica } = vi.hoisted(() => ({
  consultarGaleriaPublica: vi.fn(),
}))

vi.mock('@/features/galleries/api/galeriasApi', () => ({
  consultarGaleriaPublica,
  enviarSelecaoPublica: vi.fn(),
  toExtras: vi.fn(),
}))

import { PublicSelectionPage } from '@/features/galleries/components/public/PublicSelectionPage'

const midia = {
  id: 'm1',
  tipo: 'foto',
  nomeArquivo: 'foto.jpg',
  mimeType: 'image/jpeg',
  tamanho: 10,
  status: 'original',
  uploadedAt: '2026-01-01T00:00:00.000Z',
  thumbUrl: 'https://storage/thumb.jpg',
  processamentoStatus: 'disponivel',
}

const galeria = {
  id: 'g1',
  agendamentoId: 'a1',
  status: 'em_selecao',
  fotosInclusas: 1,
  videosInclusos: 0,
  valorFotoExtra: 0,
  totalFotos: 1,
  totalVideos: 0,
  fotosDisponiveis: 1,
  videosDisponiveis: 0,
  rawLiberado: false,
  midias: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/selecao/tok-1']}>
      <Routes>
        <Route path="/selecao/:token" element={<PublicSelectionPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite reselecionar quando a seleção foi reaberta', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      link: {
        id: 'l1',
        tipo: 'selecao',
        token: 'tok-1',
        status: 'ativo',
        expiraEm: '2026-12-01T00:00:00.000Z',
        visualizadaEm: null,
        protocolo: null,
      },
      galeria,
      midias: [midia],
      selecao: {
        status: 'rascunho',
        protocolo: 'SEL-2026-0001',
        fotoIds: ['m1'],
        videoIds: [],
        fotosExtras: 0,
        valorExtras: 0,
        enviadaEm: '2026-01-01T00:00:00.000Z',
      },
      extras: undefined,
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText('Enviar seleção')).toBeInTheDocument()
    expect(screen.queryByText('Seleção enviada')).not.toBeInTheDocument()
  })

  it('mostra a chave Pix e o upload quando há extras pendentes', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      link: {
        id: 'l1',
        tipo: 'selecao',
        token: 'tok-1',
        status: 'ativo',
        expiraEm: '2026-12-01T00:00:00.000Z',
        visualizadaEm: null,
        protocolo: null,
      },
      galeria: { ...galeria, status: 'selecao_enviada' },
      midias: [midia],
      selecao: {
        status: 'enviada',
        protocolo: 'SEL-2026-0001',
        fotoIds: ['m1'],
        videoIds: [],
        fotosExtras: 1,
        valorExtras: 50,
        enviadaEm: '2026-01-01T00:00:00.000Z',
      },
      extras: {
        id: 'e1',
        quantidadeFotos: 1,
        valorUnitario: 50,
        valorTotal: 50,
        status: 'pendente',
        chavePix: 'pix-extras@teste.com',
        instrucoesPagamento: 'Pague via Pix e anexe o comprovante.',
      },
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText('Pagamento dos extras')).toBeInTheDocument()
    expect(screen.getByText('pix-extras@teste.com')).toBeInTheDocument()
    expect(screen.getByText('Anexar comprovante Pix')).toBeInTheDocument()
  })

  it('mostra o protocolo quando a seleção já foi enviada', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      link: {
        id: 'l1',
        tipo: 'selecao',
        token: 'tok-1',
        status: 'ativo',
        expiraEm: '2026-12-01T00:00:00.000Z',
        visualizadaEm: null,
        protocolo: null,
      },
      galeria: { ...galeria, status: 'selecao_enviada' },
      midias: [midia],
      selecao: {
        status: 'enviada',
        protocolo: 'SEL-2026-0001',
        fotoIds: ['m1'],
        videoIds: [],
        fotosExtras: 0,
        valorExtras: 0,
        enviadaEm: '2026-01-01T00:00:00.000Z',
      },
      extras: undefined,
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText('Seleção enviada')).toBeInTheDocument()
    expect(screen.getByText('SEL-2026-0001')).toBeInTheDocument()
  })
})
