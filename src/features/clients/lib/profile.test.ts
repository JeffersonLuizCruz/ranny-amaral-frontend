import { describe, expect, it } from 'vitest'

import type { Contrato } from '@/domain/contracts'
import type { GaleriaEnsaio } from '@/domain/galleries'
import type { AgendamentoEnsaio, Cliente } from '@/domain/types'
import { montarResumoCliente } from '@/features/clients/lib/profile'

const cliente = {
  id: 'c1',
  nome: 'Mariana Silva',
  whatsapp: '(11) 91234-5678',
  origem: 'instagram',
  createdAt: '2024-03-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
} as Cliente

const agora = new Date('2026-11-13T12:00:00.000Z')

function ensaio(overrides: Partial<AgendamentoEnsaio> = {}): AgendamentoEnsaio {
  return {
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
    ...overrides,
  } as AgendamentoEnsaio
}

function contrato(overrides: Partial<Contrato> = {}): Contrato {
  return {
    id: 'ct1',
    numero: 'CT-2026-0001',
    clienteId: 'c1',
    agendamentoId: 'a1',
    statusAceite: 'aceito',
    valorTotal: 1000,
    valorRecebido: 300,
    valorPendente: 700,
    dataEmissao: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  } as Contrato
}

function galeria(overrides: Partial<GaleriaEnsaio> = {}): GaleriaEnsaio {
  return {
    id: 'g1',
    agendamentoId: 'a1',
    status: 'em_edicao',
    createdAt: '2026-11-21T12:00:00.000Z',
    updatedAt: '2026-11-21T12:00:00.000Z',
    ...overrides,
  } as GaleriaEnsaio
}

describe('montarResumoCliente', () => {
  it('marca cliente sem ensaios e sem valores', () => {
    const resumo = montarResumoCliente({
      cliente,
      appointments: [],
      contratos: [],
      galerias: [],
      agora,
    })

    expect(resumo.statusFinanceiro).toBe('sem_contrato')
    expect(resumo.totalEnsaios).toBe(0)
    expect(resumo.contratado).toBe(0)
    expect(resumo.recebido).toBe(0)
    expect(resumo.pendente).toBe(0)
    expect(resumo.proximoEnsaio).toBeUndefined()
  })

  it('não conta o mesmo ensaio duas vezes quando existe contrato', () => {
    const resumo = montarResumoCliente({
      cliente,
      appointments: [ensaio()],
      contratos: [contrato()],
      galerias: [],
      agora,
    })

    expect(resumo.contratado).toBe(1000)
    expect(resumo.recebido).toBe(300)
    expect(resumo.pendente).toBe(700)
    expect(resumo.statusFinanceiro).toBe('pendente')
    expect(resumo.proximoEnsaio?.id).toBe('a1')
    expect(resumo.ensaiosSemContrato).toHaveLength(0)
  })

  it('prioriza o aviso de contrato aguardando aceite', () => {
    const resumo = montarResumoCliente({
      cliente,
      appointments: [ensaio()],
      contratos: [
        contrato({ statusAceite: 'pendente', valorRecebido: 0, valorPendente: 1000 }),
      ],
      galerias: [],
      agora,
    })

    expect(resumo.statusFinanceiro).toBe('aguardando_aceite')
  })

  it('identifica cliente recorrente e a galeria ativa mais recente', () => {
    const resumo = montarResumoCliente({
      cliente,
      appointments: [
        ensaio({ id: 'a1', status: 'realizado' }),
        ensaio({ id: 'a2', status: 'realizado', dataHoraInicio: '2026-09-01T13:00:00.000Z' }),
        ensaio({ id: 'a3', status: 'realizado', dataHoraInicio: '2026-07-01T13:00:00.000Z' }),
      ],
      contratos: [],
      galerias: [
        galeria({ id: 'g1', agendamentoId: 'a1', status: 'entregue', createdAt: '2026-06-01T12:00:00.000Z' }),
        galeria({ id: 'g2', agendamentoId: 'a2', status: 'em_selecao', createdAt: '2026-10-01T12:00:00.000Z' }),
      ],
      agora,
    })

    expect(resumo.totalEnsaios).toBe(3)
    expect(resumo.recorrente).toBe(true)
    expect(resumo.ultimaGaleria?.id).toBe('g2')
    expect(resumo.galeriaAtiva?.id).toBe('g2')
  })
})
