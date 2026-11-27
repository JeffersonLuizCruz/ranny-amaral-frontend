import { describe, expect, it } from 'vitest'

import type { Contrato } from './contracts'
import {
  contarSituacoesContrato,
  contratoAguardandoAceite,
  contratoComComprovanteEmAnalise,
  contratoComEntradaEmAberto,
  filtrarContratosPorSituacao,
} from './contractQueues'

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

function comComprovante(overrides: Partial<Contrato> = {}): Contrato {
  return contrato({
    ...overrides,
    pagamento: {
      valor: 300,
      percentual: 30,
      status: 'pendente',
      comprovante,
    },
  })
}

describe('contractQueues', () => {
  it('considera comprovante em análise apenas quando pendente e sem rejeição', () => {
    expect(contratoComComprovanteEmAnalise(comComprovante())).toBe(true)
    expect(contratoComComprovanteEmAnalise(contrato())).toBe(false)
    expect(
      contratoComComprovanteEmAnalise(
        contrato({
          pagamento: {
            valor: 300,
            percentual: 30,
            status: 'pendente',
            comprovante,
            rejeicao: {
              motivo: 'Ilegível',
              rejeitadoEm: '2026-01-03T10:00:00Z',
            },
          },
        }),
      ),
    ).toBe(false)
  })

  it('coloca pendentes e expirados em "Cliente não aceitou"', () => {
    expect(
      contratoAguardandoAceite(contrato({ statusAceite: 'pendente' })),
    ).toBe(true)
    expect(
      contratoAguardandoAceite(contrato({ statusAceite: 'expirado' })),
    ).toBe(true)
    expect(
      contratoAguardandoAceite(contrato({ statusAceite: 'rascunho' })),
    ).toBe(false)
  })

  it('dá prioridade ao comprovante em análise sobre o aceite', () => {
    const pendenteComComprovante = comComprovante({ statusAceite: 'pendente' })

    expect(contratoComComprovanteEmAnalise(pendenteComComprovante)).toBe(true)
    expect(contratoAguardandoAceite(pendenteComComprovante)).toBe(false)
  })

  it('coloca entrada em aberto apenas em contratos já aceitos', () => {
    expect(contratoComEntradaEmAberto(contrato())).toBe(true)
    expect(
      contratoComEntradaEmAberto(
        contrato({
          pagamento: {
            valor: 300,
            percentual: 30,
            status: 'pendente',
            comprovante,
            rejeicao: {
              motivo: 'Ilegível',
              rejeitadoEm: '2026-01-03T10:00:00Z',
            },
          },
        }),
      ),
    ).toBe(true)
    expect(contratoComEntradaEmAberto(comComprovante())).toBe(false)
    expect(
      contratoComEntradaEmAberto(contrato({ statusAceite: 'pendente' })),
    ).toBe(false)
    expect(
      contratoComEntradaEmAberto(contrato({ statusEntrada: 'confirmado' })),
    ).toBe(false)
  })

  it('conta as filas sem duplicar contratos', () => {
    const contagem = contarSituacoesContrato([
      contrato({ id: 'aceite-pendente', statusAceite: 'pendente' }),
      contrato({ id: 'sem-entrada', statusAceite: 'aceito' }),
      comComprovante({ id: 'em-analise' }),
      contrato({ id: 'rascunho', statusAceite: 'rascunho' }),
    ])

    expect(contagem).toEqual({
      todos: 4,
      aguardando_aceite: 1,
      entrada_em_aberto: 1,
      comprovante_em_analise: 1,
    })
  })

  it('filtra a lista pela fila selecionada', () => {
    const contratos = [
      contrato({ id: 'aceite-pendente', statusAceite: 'pendente' }),
      contrato({ id: 'sem-entrada', statusAceite: 'aceito' }),
      comComprovante({ id: 'em-analise' }),
    ]

    expect(
      filtrarContratosPorSituacao(contratos, 'todos').map((item) => item.id),
    ).toEqual(['aceite-pendente', 'sem-entrada', 'em-analise'])
    expect(
      filtrarContratosPorSituacao(contratos, 'aguardando_aceite').map(
        (item) => item.id,
      ),
    ).toEqual(['aceite-pendente'])
    expect(
      filtrarContratosPorSituacao(contratos, 'entrada_em_aberto').map(
        (item) => item.id,
      ),
    ).toEqual(['sem-entrada'])
    expect(
      filtrarContratosPorSituacao(contratos, 'comprovante_em_analise').map(
        (item) => item.id,
      ),
    ).toEqual(['em-analise'])
  })
})
