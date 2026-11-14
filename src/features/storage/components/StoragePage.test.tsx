import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarGaleriasArmazenamento, obterResumoArmazenamento } = vi.hoisted(() => ({
  listarGaleriasArmazenamento: vi.fn(),
  obterResumoArmazenamento: vi.fn(),
}))

vi.mock('@/features/storage/api/armazenamentoApi', () => ({
  listarGaleriasArmazenamento,
  obterResumoArmazenamento,
  coletarArmazenamento: vi.fn(),
  reconciliarArmazenamento: vi.fn(),
  limparArmazenamento: vi.fn(),
  detalharArmazenamentoGaleria: vi.fn(),
  solicitarExpurgo: vi.fn(),
  cancelarExpurgo: vi.fn(),
}))

import { StoragePage } from '@/features/storage/components/StoragePage'
import { useAuthStore } from '@/features/auth/store/authStore'

const GB = 1024 * 1024 * 1024

const resumo = {
  coletadoEm: '2026-11-12T10:00:00.000Z',
  origemColeta: 'FILESYSTEM' as const,
  volumePath: '/var/lib/garage/data',
  totalBytes: 100 * GB,
  livreBytes: 38 * GB,
  usadoBytes: 62 * GB,
  crmBytes: 41 * GB,
  objetosBytes: 39 * GB,
  postgresBytes: 2 * GB,
  outrosBytes: 21 * GB,
  reservaBytes: 10 * GB,
  disponivelParaFotosBytes: 28 * GB,
  percentualUsado: 62,
  percentualLimpeza: 90,
  percentualAlvo: 80,
  alerta: 'OK' as const,
  diasRestantesEstimados: 120,
  galeriasElegiveis: 1,
  totais: {
    originaisBytes: 20 * GB,
    editadasBytes: 15 * GB,
    derivadosBytes: 4 * GB,
    videosBytes: 0,
    comprovantesBytes: 1024 * 1024,
    totalBytes: 39 * GB,
    quantidade: 120,
  },
}

const galerias = [
  {
    galeriaId: 'g1',
    clienteNome: 'Cliente Elegível',
    status: 'entregue',
    totalBytes: 6 * GB,
    quantidadeArquivos: 400,
    entregueEm: '2026-11-01T10:00:00.000Z',
    zipBaixadoEm: '2026-11-05T10:00:00.000Z',
    zipConcluidoEm: '2026-11-05T10:01:00.000Z',
    expurgoStatus: 'nenhum',
    expurgoEfetivadoEm: null,
    bytesExpurgados: 0,
    elegivel: true,
    motivoBloqueio: null,
  },
  {
    galeriaId: 'g2',
    clienteNome: 'Cliente Sem Zip',
    status: 'entregue',
    totalBytes: 4 * GB,
    quantidadeArquivos: 200,
    entregueEm: '2026-11-02T10:00:00.000Z',
    zipBaixadoEm: null,
    zipConcluidoEm: null,
    expurgoStatus: 'nenhum',
    expurgoEfetivadoEm: null,
    bytesExpurgados: 0,
    elegivel: false,
    motivoBloqueio: 'O cliente ainda nao concluiu o download do ZIP.',
  },
  {
    galeriaId: 'g3',
    clienteNome: 'Cliente Expurgado',
    status: 'expurgada',
    totalBytes: 0,
    quantidadeArquivos: 0,
    entregueEm: '2026-09-01T10:00:00.000Z',
    zipBaixadoEm: '2026-09-02T10:00:00.000Z',
    zipConcluidoEm: '2026-09-02T10:01:00.000Z',
    expurgoStatus: 'executado',
    expurgoEfetivadoEm: '2026-09-10T10:00:00.000Z',
    bytesExpurgados: 5 * GB,
    elegivel: false,
    motivoBloqueio: 'Galeria ja expurgada.',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <StoragePage />
    </MemoryRouter>,
  )
}

describe('StoragePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    obterResumoArmazenamento.mockResolvedValue(resumo)
    listarGaleriasArmazenamento.mockResolvedValue(galerias)
    useAuthStore.setState({
      usuario: {
        id: 'u1',
        nome: 'Admin',
        email: 'admin@teste.com',
        role: 'admin',
        ativo: true,
        deveTrocarSenha: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    })
  })

  it('mostra disco, CRM, infraestrutura e a fila de expurgo', async () => {
    renderPage()

    expect(await screen.findByText('Armazenamento')).toBeInTheDocument()
    expect(screen.getByText(/100 GB no total/)).toBeInTheDocument()
    expect(screen.getByText(/62 GB usados/)).toBeInTheDocument()
    expect(screen.getByText(/38 GB livres/)).toBeInTheDocument()

    expect(screen.getByText('CRM (storage + banco)')).toBeInTheDocument()
    expect(screen.getByText('41 GB')).toBeInTheDocument()
    expect(screen.getByText('Infraestrutura')).toBeInTheDocument()
    expect(screen.getByText('21 GB')).toBeInTheDocument()
    expect(screen.getByText(/cerca de 120 dia/)).toBeInTheDocument()

    expect(screen.getByText('Fila de expurgo (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Cliente Elegível').length).toBeGreaterThan(0)
    expect(screen.getAllByText('elegível').length).toBeGreaterThan(0)

    expect(screen.getByText('Atenção: entregues sem ZIP (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Cliente Sem Zip').length).toBeGreaterThan(0)

    expect(screen.getByText(/1 expurgada/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Expurgar' }).length).toBeGreaterThan(0)
  })

  it('gestor acompanha o armazenamento sem ações de expurgo', async () => {
    useAuthStore.setState((estado) => ({
      ...estado,
      usuario: estado.usuario ? { ...estado.usuario, role: 'gestor' } : null,
    }))

    renderPage()

    expect(await screen.findByText('Fila de expurgo (1)')).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: 'Expurgar' })).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Coletar agora/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reconciliar/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Expurgar até/ }),
    ).not.toBeInTheDocument()
  })

  it('mostra a limpeza recomendada quando o disco passa de 90%', async () => {
    obterResumoArmazenamento.mockResolvedValue({
      ...resumo,
      usadoBytes: 92 * GB,
      livreBytes: 8 * GB,
      percentualUsado: 92,
      alerta: 'LIMPEZA' as const,
    })

    renderPage()

    expect(await screen.findByText('LIMPEZA')).toBeInTheDocument()
    expect(
      screen.getByText(/1 galeria\(s\) elegíveis/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Expurgar até 80%/ }),
    ).toBeInTheDocument()
  })
})
