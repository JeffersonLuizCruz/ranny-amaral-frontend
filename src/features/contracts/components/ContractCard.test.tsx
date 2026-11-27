import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { Contrato } from '@/domain/contracts'
import { ContractCard } from './ContractCard'

function contrato(overrides: Partial<Contrato> = {}): Contrato {
  return {
    id: 'c1',
    numero: 'CT-2026-0001',
    modeloId: 'm1',
    statusAceite: 'aceito',
    titulo: 'Contrato',
    clausulas: [],
    snapshot: {
      cliente: { nome: 'Marina Teste', whatsapp: '(11) 91234-5678' },
      estudio: { nome: 'Estúdio', percentualEntradaPadrao: 30 },
      modeloVersao: 1,
    },
    valorTotal: 1000,
    valorEntrada: 300,
    percentualEntrada: 30,
    saldoRestante: 700,
    pagamento: {
      valor: 300,
      percentual: 30,
      status: 'pendente',
    },
    pagamentoFinal: { valor: 700, status: 'pendente' },
    statusEntrada: 'pendente',
    statusSaldoFinal: 'pendente',
    entradaQuitada: false,
    saldoQuitado: false,
    quitado: false,
    valorRecebido: 0,
    valorPendente: 1000,
    formaPagamento: 'pix',
    dataEmissao: '2026-01-01T00:00:00Z',
    historico: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderCard(value: Contrato) {
  return render(
    <MemoryRouter>
      <ContractCard contrato={value} />
    </MemoryRouter>,
  )
}

describe('ContractCard', () => {
  it('destaca o comprovante em análise como ação principal', () => {
    renderCard(
      contrato({
        pagamento: {
          valor: 300,
          percentual: 30,
          status: 'pendente',
          comprovante: {
            arquivoKey: 'chave',
            nomeArquivo: 'comprovante.pdf',
            mimeType: 'application/pdf',
            tamanho: 2048,
            enviadoEm: '2026-01-02T10:00:00Z',
          },
        },
      }),
    )

    expect(
      screen.getByRole('link', { name: /Conferir comprovante/ }),
    ).toHaveAttribute('href', '/contratos/c1#pagamento')
    expect(
      screen.queryByRole('button', { name: /Lembrar no WhatsApp/ }),
    ).not.toBeInTheDocument()
  })

  it('oferece lembrete por WhatsApp quando o cliente ainda não aceitou', () => {
    renderCard(contrato({ statusAceite: 'pendente' }))

    expect(
      screen.getByRole('button', { name: /Lembrar no WhatsApp/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Conferir comprovante/ }),
    ).not.toBeInTheDocument()
  })

  it('não oferece WhatsApp quando o cliente não tem telefone', () => {
    renderCard(
      contrato({
        statusAceite: 'pendente',
        snapshot: {
          cliente: { nome: 'Marina Teste' },
          estudio: { nome: 'Estúdio', percentualEntradaPadrao: 30 },
          modeloVersao: 1,
        },
      }),
    )

    expect(
      screen.queryByRole('button', { name: /Lembrar no WhatsApp/ }),
    ).not.toBeInTheDocument()
  })
})
