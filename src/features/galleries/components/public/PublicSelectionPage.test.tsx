import { fireEvent, render, screen } from '@testing-library/react'
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
  numero: 1,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  thumbUrl: 'https://storage/thumb.jpg',
  processamentoStatus: 'disponivel',
  liberadaEm: '2026-01-02T00:00:00.000Z',
  disponivelParaDownload: true,
  liberacaoAutomatica: true,
}

const estadoPublico = {
  fase: 'selecao',
  fotosSelecionadas: 0,
  fotosLiberadas: 0,
  videosSelecionados: 0,
  videosLiberados: 0,
} as const

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
      ...estadoPublico,
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
    expect(screen.getByText('001')).toBeInTheDocument()
  })

  it('mostra a chave Pix e o upload quando há extras pendentes', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      ...estadoPublico,
      fase: 'aguardando_pagamento',
      fotosSelecionadas: 1,
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
      ...estadoPublico,
      fase: 'em_liberacao',
      fotosSelecionadas: 1,
      fotosLiberadas: 1,
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

    expect(await screen.findByText('Progresso da liberação')).toBeInTheDocument()
    expect(screen.getByText(/SEL-2026-0001/)).toBeInTheDocument()
    expect(screen.getByText('Disponíveis para baixar (1)')).toBeInTheDocument()
    expect(screen.getByAltText('foto.jpg')).toBeInTheDocument()
  })

  it('bloqueia mídias já entregues e mostra o resumo de extras', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      ...estadoPublico,
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
        protocolo: 'SEL-2026-0002',
        fotoIds: ['m1'],
        videoIds: [],
        fotosExtras: 1,
        valorExtras: 50,
        enviadaEm: '2026-01-02T00:00:00.000Z',
      },
      resumoExtras: {
        quantidadeTotal: 1,
        valorTotal: 50,
        quantidadeCoberta: 1,
        valorCoberto: 50,
        quantidadePendente: 0,
        valorPendente: 0,
      },
      midiasEntregues: ['m1'],
      extras: undefined,
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText(/Você já comprou/)).toBeInTheDocument()
    expect(screen.getByLabelText('Mídia já entregue')).toBeInTheDocument()

    fireEvent.click(screen.getByAltText('foto.jpg'))

    expect(
      screen.getByRole('heading', { name: /Fotos \(1 selecionadas\)/ }),
    ).toBeInTheDocument()
  })

  it('rotula o pedido pendente como extras adicionais', async () => {
    consultarGaleriaPublica.mockResolvedValue({
      ...estadoPublico,
      fase: 'aguardando_pagamento',
      fotosSelecionadas: 20,
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
        protocolo: 'SEL-2026-0003',
        fotoIds: ['m1'],
        videoIds: [],
        fotosExtras: 2,
        valorExtras: 100,
        enviadaEm: '2026-01-03T00:00:00.000Z',
      },
      resumoExtras: {
        quantidadeTotal: 2,
        valorTotal: 100,
        quantidadeCoberta: 1,
        valorCoberto: 50,
        quantidadePendente: 1,
        valorPendente: 50,
      },
      midiasEntregues: [],
      extras: {
        id: 'e2',
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

    expect(await screen.findByText('Extras adicionais')).toBeInTheDocument()
  })

  it('separa extras cobertos das novas fotos antes do envio', async () => {
    const fotos = Array.from({ length: 20 }, (_, indice) => ({
      ...midia,
      id: `m${indice + 1}`,
      numero: indice + 1,
      nomeArquivo: `foto-${indice + 1}.jpg`,
    }))

    consultarGaleriaPublica.mockResolvedValue({
      ...estadoPublico,
      link: {
        id: 'l1',
        tipo: 'selecao',
        token: 'tok-1',
        status: 'ativo',
        expiraEm: '2026-12-01T00:00:00.000Z',
        visualizadaEm: null,
        protocolo: null,
      },
      galeria: { ...galeria, fotosInclusas: 15, valorFotoExtra: 35 },
      midias: fotos,
      selecao: {
        status: 'rascunho',
        protocolo: 'SEL-2026-0010',
        fotoIds: fotos.map((foto) => foto.id),
        videoIds: [],
        fotosExtras: 5,
        valorExtras: 175,
        enviadaEm: '2026-01-10T00:00:00.000Z',
      },
      resumoExtras: {
        quantidadeTotal: 5,
        valorTotal: 175,
        quantidadeCoberta: 3,
        valorCoberto: 105,
        quantidadePendente: 0,
        valorPendente: 0,
      },
      midiasEntregues: [],
      extras: undefined,
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText(/Extras na seleção:/)).toBeInTheDocument()
    expect(screen.getByText(/Já cobertos: 3/)).toBeInTheDocument()
    expect(screen.getByText(/Novas agora \(a pagar\): 2/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*70,00/)).toBeInTheDocument()
  })

  it('mostra o valor a pagar agora, não o total acumulado', async () => {
    const fotos = Array.from({ length: 20 }, (_, indice) => ({
      ...midia,
      id: `m${indice + 1}`,
      numero: indice + 1,
      nomeArquivo: `foto-${indice + 1}.jpg`,
    }))

    consultarGaleriaPublica.mockResolvedValue({
      ...estadoPublico,
      fase: 'aguardando_pagamento',
      fotosSelecionadas: 20,
      link: {
        id: 'l1',
        tipo: 'selecao',
        token: 'tok-1',
        status: 'ativo',
        expiraEm: '2026-12-01T00:00:00.000Z',
        visualizadaEm: null,
        protocolo: null,
      },
      galeria: {
        ...galeria,
        status: 'selecao_enviada',
        fotosInclusas: 15,
        valorFotoExtra: 35,
      },
      midias: fotos,
      selecao: {
        status: 'enviada',
        protocolo: 'SEL-2026-0011',
        fotoIds: fotos.map((foto) => foto.id),
        videoIds: [],
        fotosExtras: 5,
        valorExtras: 175,
        enviadaEm: '2026-01-11T00:00:00.000Z',
      },
      resumoExtras: {
        quantidadeTotal: 5,
        valorTotal: 175,
        quantidadeCoberta: 3,
        valorCoberto: 105,
        quantidadePendente: 2,
        valorPendente: 70,
      },
      midiasEntregues: [],
      extras: {
        id: 'e3',
        quantidadeFotos: 2,
        valorUnitario: 35,
        valorTotal: 70,
        status: 'pendente',
        chavePix: 'pix-extras@teste.com',
        instrucoesPagamento: 'Pague via Pix e anexe o comprovante.',
      },
      entregaDisponivel: false,
    })

    renderPage()

    expect(await screen.findByText('Progresso da liberação')).toBeInTheDocument()
    expect(screen.getByText(/Total na seleção:/)).toBeInTheDocument()
    expect(screen.getByText(/Já coberto: 3/)).toBeInTheDocument()
    expect(screen.getByText(/A pagar agora: 2/)).toBeInTheDocument()
    expect(screen.queryByText(/A pagar agora: 5/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*70,00/).length).toBeGreaterThan(0)
  })
})
