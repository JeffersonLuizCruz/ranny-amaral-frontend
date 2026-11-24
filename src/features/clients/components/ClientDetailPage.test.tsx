import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientDetailPage } from '@/features/clients/components/ClientDetailPage'

const { estado } = vi.hoisted(() => ({
  estado: {
    cliente: {
      id: 'c1',
      nome: 'Mariana Silva',
      whatsapp: '(11) 91234-5678',
      email: 'mariana@teste.com',
      origem: 'instagram',
      cidade: 'São Paulo',
      createdAt: '2024-03-01T12:00:00.000Z',
      updatedAt: '2026-11-01T12:00:00.000Z',
    },
    appointments: [
      {
        id: 'a1',
        clienteId: 'c1',
        pacoteId: 'p1',
        dataHoraInicio: '2026-11-20T13:00:00.000Z',
        dataHoraFim: '2026-11-20T14:30:00.000Z',
        local: 'Estúdio',
        status: 'confirmado',
        valorAcordado: 1000,
        valorRecebido: 300,
        valorPendente: 700,
        updatedAt: '2026-10-01T12:00:00.000Z',
      },
    ],
    contratos: [
      {
        id: 'ct1',
        numero: 'CT-2026-0001',
        clienteId: 'c1',
        agendamentoId: 'a1',
        statusAceite: 'aceito',
        statusEntrada: 'confirmado',
        statusSaldoFinal: 'pendente',
        valorTotal: 1000,
        valorRecebido: 300,
        valorPendente: 700,
        dataEmissao: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-01T12:00:00.000Z',
      },
    ],
    galerias: [
      {
        id: 'g1',
        agendamentoId: 'a1',
        status: 'em_edicao',
        pacoteNome: 'Ensaio Gestante',
        pacoteCorHex: '#7C3AED',
        totalFotos: 20,
        totalVideos: 0,
        fotosSelecionadas: 20,
        fotosProntas: 8,
        createdAt: '2026-11-21T12:00:00.000Z',
        updatedAt: '2026-11-21T12:00:00.000Z',
      },
    ],
    pacotes: [
      {
        id: 'p1',
        nome: 'Ensaio Gestante',
        corHex: '#7C3AED',
      },
    ],
    listarGalerias: vi.fn(),
    openAppointmentDrawer: vi.fn(),
  },
}))

vi.mock('@/features/clients/store/clientStore', () => ({
  useClientStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      clientes: [estado.cliente],
      carregando: false,
      carregado: true,
    }),
}))

vi.mock('@/features/appointments/store/appointmentStore', () => ({
  useAppointmentStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ appointments: estado.appointments }),
}))

vi.mock('@/features/contracts/store/contractStore', () => ({
  useContractStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ contratos: estado.contratos }),
}))

vi.mock('@/features/galleries/store/galleryStore', () => ({
  useGalleryStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ galerias: estado.galerias }),
}))

vi.mock('@/features/packages/store/packageStore', () => ({
  usePackageStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ pacotes: estado.pacotes }),
}))

vi.mock('@/features/agenda/store/agendaStore', () => ({
  useAgendaStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ openAppointmentDrawer: estado.openAppointmentDrawer }),
}))

vi.mock('@/features/galleries/api/galeriasApi', () => ({
  listarGalerias: estado.listarGalerias,
}))

function renderPage(state?: { origem: 'agenda' }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/clientes/c1', state }]}>
      <Routes>
        <Route path="/clientes/:clienteId" element={<ClientDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ClientDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    estado.listarGalerias.mockResolvedValue({
      itens: [],
      pagina: 0,
      tamanho: 100,
      totalItens: 0,
      totalPaginas: 0,
      temAnterior: false,
      temProxima: false,
    })
  })

  it('abre direto nos KPIs financeiros e lista contratos e galerias', async () => {
    renderPage()

    expect(await screen.findByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Contratado')).toBeInTheDocument()
    expect(screen.getByText('Recebido')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 1.000,00').length).toBeGreaterThan(0)
    expect(screen.getByText('CT-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('Galerias')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
  })

  it('exibe o nome do cliente no cabeçalho da ficha', async () => {
    renderPage()

    await screen.findByText('Financeiro')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mariana Silva' }),
    ).toBeInTheDocument()
  })

  it('oferece voltar para a agenda quando a ficha é aberta a partir do ensaio', async () => {
    renderPage({ origem: 'agenda' })

    const link = await screen.findByRole('link', {
      name: /Voltar para a agenda/,
    })
    expect(link.getAttribute('href')).toBe('/agenda')
  })

  it('não oferece voltar para a agenda em acesso direto à ficha', async () => {
    renderPage()

    await screen.findByText('Financeiro')
    expect(
      screen.queryByRole('link', { name: /Voltar para a agenda/ }),
    ).not.toBeInTheDocument()
  })

  it('busca galerias atualizadas pelo nome do cliente', async () => {
    renderPage()

    expect(estado.listarGalerias).toHaveBeenCalledWith({
      q: 'Mariana Silva',
      tamanho: 100,
    })
  })
})
