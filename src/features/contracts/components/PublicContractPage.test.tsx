import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Contrato, DadosAceite, SolicitacaoAceite } from '@/domain/contracts'

const { getByToken, markViewed, accept, submitProof } = vi.hoisted(() => ({
  getByToken: vi.fn(),
  markViewed: vi.fn(),
  accept: vi.fn(),
  submitProof: vi.fn(),
}))

vi.mock('@/integrations/acceptance', () => ({
  acceptanceAdapter: {
    mode: 'remote',
    getByToken,
    markViewed,
    accept,
    submitProof,
  },
}))

import { PublicContractPage } from '@/features/contracts/components/PublicContractPage'

const contrato: Contrato = {
  id: 'ct-1',
  numero: 'CT-2026-0001',
  clienteId: 'cli-1',
  modeloId: 'mod-1',
  statusAceite: 'pendente',
  titulo: 'Contrato de Prestação de Serviços Fotográficos',
  clausulas: [
    {
      id: 'cl-1',
      titulo: 'Cláusula 1 — Objeto',
      corpo: 'O estúdio prestará serviços fotográficos conforme o pacote contratado.',
    },
  ],
  snapshot: {
    cliente: {
      nome: 'Marina Alves',
      whatsapp: '(11) 99999-9999',
      email: 'marina@example.com',
      documento: '529.982.247-25',
      tipoDocumento: 'cpf',
      cidade: 'São Paulo',
    },
    pacote: {
      nome: 'Ensaio Gestante',
      duracaoMinutos: 60,
      valor: 1200,
      itensInclusos: [],
      quantidadeFotosInclusas: 10,
      quantidadeVideosInclusos: 0,
      valorFotoExtra: 50,
    },
    agendamento: {
      dataHoraInicio: '2026-12-01T13:00:00.000Z',
      dataHoraFim: '2026-12-01T14:00:00.000Z',
      local: 'Estúdio Ranny Amaral',
      valorAcordado: 1200,
    },
    estudio: {
      nome: 'Ranny Amaral',
      razaoSocial: 'Ranny Amaral Fotografia LTDA',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua das Flores, 100',
      cidade: 'São Paulo',
      estado: 'SP',
      email: 'contato@rannyamaral.com.br',
      telefone: '(11) 99999-9999',
      responsavel: 'Ranny Amaral',
      site: 'https://rannyamaral.com.br',
      foro: 'São Paulo/SP',
      percentualEntradaPadrao: 30,
      chavePix: 'pix@rannyamaral.com.br',
      instrucoesPagamento: 'Pague via Pix e anexe o comprovante.',
      prazoPagamentoDias: 3,
    },
    modeloVersao: 1,
  },
  valorTotal: 1200,
  valorEntrada: 360,
  percentualEntrada: 30,
  saldoRestante: 840,
  pagamento: { valor: 360, percentual: 30, status: 'pendente' },
  pagamentoFinal: { valor: 840, status: 'pendente' },
  statusEntrada: 'pendente',
  statusSaldoFinal: 'pendente',
  entradaQuitada: false,
  saldoQuitado: false,
  quitado: false,
  valorRecebido: 0,
  valorPendente: 1200,
  formaPagamento: 'Pix',
  dataEmissao: '2026-11-20T00:00:00.000Z',
  historico: [],
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
}

const solicitacao: SolicitacaoAceite = {
  id: 'sol-1',
  contratoId: contrato.id,
  token: 'tok-1',
  status: 'pendente',
  criadaEm: '2026-11-20T00:00:00.000Z',
  expiraEm: '2026-12-20T00:00:00.000Z',
}

const aceite: DadosAceite = {
  nomeCompleto: 'Marina Alves',
  tipoDocumento: 'cpf',
  documento: '529.982.247-25',
  cidade: 'São Paulo',
  whatsapp: '(11) 99999-9999',
  autorizaUsoImagem: true,
  aceitoEm: '2026-11-23T12:00:00.000Z',
  protocolo: 'ACE-2026-0001',
  hashConteudo: 'hash-de-conteudo',
}

const contratoAceito: Contrato = {
  ...contrato,
  statusAceite: 'aceito',
  aceite,
}

const solicitacaoAceita: SolicitacaoAceite = {
  ...solicitacao,
  status: 'aceita',
  dadosAceite: aceite,
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/assinar/tok-1']}>
      <Routes>
        <Route path="/assinar/:token" element={<PublicContractPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicContractPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    markViewed.mockResolvedValue(undefined)
  })

  it('exibe a marca, o hero e o resumo do contrato pendente', async () => {
    getByToken.mockResolvedValue({ solicitacao, contrato })

    renderPage()

    expect(await screen.findByText('Aceite de contrato')).toBeInTheDocument()
    expect(screen.getAllByAltText('Logo de Ranny Amaral').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CT-2026-0001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ensaio Gestante').length).toBeGreaterThan(0)
    expect(screen.getAllByText('R$ 360,00').length).toBeGreaterThan(0)
  })

  it('abre e fecha o contrato completo pelo acordeão', async () => {
    getByToken.mockResolvedValue({ solicitacao, contrato })

    renderPage()

    const toggle = await screen.findByRole('button', { name: /Contrato completo/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('Cláusula 1 — Objeto'),
    ).toBeInTheDocument()
  })

  it('mostra a tela de erro para token inválido', async () => {
    getByToken.mockResolvedValue(null)

    renderPage()

    expect(await screen.findByText('Não foi possível abrir')).toBeInTheDocument()
    expect(
      screen.getByText('Link inválido ou contrato não encontrado.'),
    ).toBeInTheDocument()
  })

  it('mostra link expirado e contrato cancelado', async () => {
    getByToken.mockResolvedValueOnce({
      solicitacao: { ...solicitacao, status: 'expirada' },
      contrato: { ...contrato, statusAceite: 'expirado' },
    })

    const { unmount } = renderPage()
    expect(await screen.findByText('Link expirado')).toBeInTheDocument()
    unmount()

    getByToken.mockResolvedValueOnce({
      solicitacao: { ...solicitacao, status: 'cancelada' },
      contrato: { ...contrato, statusAceite: 'cancelado' },
    })

    renderPage()
    expect(await screen.findByText('Contrato cancelado')).toBeInTheDocument()
  })

  it('exige comprovante e registra o aceite com sucesso', async () => {
    getByToken.mockResolvedValue({ solicitacao, contrato })
    accept.mockResolvedValue({
      protocolo: aceite.protocolo,
      contrato: contratoAceito,
      solicitacao: solicitacaoAceita,
    })
    submitProof.mockResolvedValue({
      contrato: contratoAceito,
      solicitacao: solicitacaoAceita,
    })

    renderPage()
    await screen.findByText('Aceite de contrato')

    fireEvent.change(screen.getByLabelText('Nome completo *'), {
      target: { value: 'Marina Alves' },
    })
    fireEvent.change(screen.getByLabelText('Número *'), {
      target: { value: '529.982.247-25' },
    })
    fireEvent.change(screen.getByLabelText('Cidade *'), {
      target: { value: 'São Paulo' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /Li e aceito/i }))
    fireEvent.click(screen.getByRole('button', { name: /Aceitar contrato/i }))

    expect(
      await screen.findByText('Anexe o comprovante de pagamento da entrada.'),
    ).toBeInTheDocument()
    expect(accept).not.toHaveBeenCalled()

    const proofInput = document.querySelector('#acceptance-proof') as HTMLInputElement
    const file = new File(['%PDF-1.4'], 'comprovante.pdf', { type: 'application/pdf' })
    fireEvent.change(proofInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /Aceitar contrato/i }))

    expect(await screen.findByText('Contrato aceito com sucesso!')).toBeInTheDocument()
    expect(screen.getAllByText('ACE-2026-0001').length).toBeGreaterThan(0)
    expect(submitProof).toHaveBeenCalled()
  })

  it('imprime o comprovante pelo documento público', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    getByToken.mockResolvedValue({
      solicitacao: solicitacaoAceita,
      contrato: contratoAceito,
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Imprimir comprovante/i }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
  })

  it('bloqueia indexação da capability URL', async () => {
    getByToken.mockResolvedValue({ solicitacao, contrato })

    renderPage()
    await screen.findByText('Aceite de contrato')

    expect(
      document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex, nofollow, noarchive')
    expect(
      document.head.querySelector('meta[name="referrer"]')?.getAttribute('content'),
    ).toBe('no-referrer')
  })
})
