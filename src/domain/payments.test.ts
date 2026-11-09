import { describe, expect, it } from 'vitest'

import { ENTRADA_STATUS_META, SALDO_FINAL_STATUS_META } from '@/domain/payments'

describe('metadados de pagamento', () => {
  it('diferencia o status da entrada do status do saldo final', () => {
    expect(ENTRADA_STATUS_META.pendente.label).toBe('Entrada pendente')
    expect(ENTRADA_STATUS_META.confirmado.label).toBe('Entrada confirmada')
    expect(SALDO_FINAL_STATUS_META.pendente.label).toBe('Saldo final pendente')
    expect(SALDO_FINAL_STATUS_META.confirmado.label).toBe('Saldo final recebido')
  })

  it('não usa o rótulo genérico "Pagamento confirmado" para a entrada', () => {
    const labels = Object.values(ENTRADA_STATUS_META).map((meta) => meta.label)

    expect(labels).not.toContain('Pagamento confirmado')
  })
})
