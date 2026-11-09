import { describe, expect, it } from 'vitest'

import type { AgendamentoEnsaio } from '@/domain/types'
import { paymentStateOf } from '@/features/agenda/lib/paymentState'

function appointment(patch: Partial<AgendamentoEnsaio>): AgendamentoEnsaio {
  return patch as AgendamentoEnsaio
}

describe('paymentStateOf', () => {
  it('classifica entrada pendente antes do saldo final', () => {
    expect(
      paymentStateOf(appointment({ entradaQuitada: false, saldoQuitado: false, quitado: false })),
    ).toBe('entrada_pendente')
  })

  it('classifica saldo final pendente quando a entrada já foi quitada', () => {
    expect(
      paymentStateOf(appointment({ entradaQuitada: true, saldoQuitado: false, quitado: false })),
    ).toBe('saldo_pendente')
  })

  it('classifica contrato quitado', () => {
    expect(
      paymentStateOf(appointment({ entradaQuitada: true, saldoQuitado: true, quitado: true })),
    ).toBe('quitado')
  })
})
