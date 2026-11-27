import { describe, expect, it } from 'vitest'

import type { Contrato } from '@/domain/contracts'
import {
  mensagemLembreteAceite,
  mensagemLembreteContrato,
  mensagemLembreteEntrada,
  tipoLembreteContrato,
} from './whatsappReminder'

function contrato(overrides: Partial<Contrato> = {}): Contrato {
  return {
    id: 'c1',
    numero: 'CT-2026-0001',
    modeloId: 'm1',
    statusAceite: 'aceito',
    titulo: 'Contrato',
    clausulas: [],
    snapshot: {
      cliente: { nome: 'Marina Teste' },
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

const comprovante = {
  arquivoKey: 'estudio/contratos/c1/comprovantes/c.pdf',
  nomeArquivo: 'comprovante.pdf',
  mimeType: 'application/pdf',
  tamanho: 2048,
  enviadoEm: '2026-01-02T10:00:00Z',
}

describe('whatsappReminder', () => {
  it('cobra o aceite quando o contrato está pendente', () => {
    const pendente = contrato({ statusAceite: 'pendente' })

    expect(tipoLembreteContrato(pendente)).toBe('aceite')
    expect(
      mensagemLembreteAceite(pendente, 'https://crm.test/assinar/abc'),
    ).toContain('Olá, Marina!')
    expect(
      mensagemLembreteAceite(pendente, 'https://crm.test/assinar/abc'),
    ).toContain('CT-2026-0001')
    expect(
      mensagemLembreteAceite(pendente, 'https://crm.test/assinar/abc'),
    ).toContain('https://crm.test/assinar/abc')
  })

  it('cobra a entrada quando o contrato já foi aceito', () => {
    const aceito = contrato()

    expect(tipoLembreteContrato(aceito)).toBe('entrada')
    expect(
      mensagemLembreteEntrada(aceito, 'https://crm.test/assinar/abc'),
    ).toContain('Falta confirmar a entrada')
  })

  it('inclui o motivo quando o comprovante foi recusado', () => {
    const rejeitado = contrato({
      pagamento: {
        valor: 300,
        percentual: 30,
        status: 'pendente',
        comprovante,
        rejeicao: {
          motivo: 'Comprovante ilegível',
          rejeitadoEm: '2026-01-03T10:00:00Z',
        },
      },
    })

    expect(tipoLembreteContrato(rejeitado)).toBe('entrada')
    expect(
      mensagemLembreteEntrada(rejeitado, 'https://crm.test/assinar/abc'),
    ).toContain('Comprovante ilegível')
  })

  it('não cobra quando o comprovante está em análise', () => {
    const emAnalise = contrato({
      statusAceite: 'pendente',
      pagamento: {
        valor: 300,
        percentual: 30,
        status: 'pendente',
        comprovante,
      },
    })

    expect(tipoLembreteContrato(emAnalise)).toBeNull()
    expect(
      mensagemLembreteContrato(emAnalise, 'https://crm.test/assinar/abc'),
    ).toBeNull()
  })

  it('não cobra contrato já pago ou em rascunho', () => {
    expect(
      tipoLembreteContrato(contrato({ statusEntrada: 'confirmado' })),
    ).toBeNull()
    expect(
      tipoLembreteContrato(contrato({ statusAceite: 'rascunho' })),
    ).toBeNull()
  })
})
