import { describe, expect, it } from 'vitest'

import {
  createEmptyAppointmentValues,
  validateAppointmentForm,
  type AppointmentFormValues,
} from '@/features/appointments/lib/validation'

function valores(overrides: Partial<AppointmentFormValues> = {}): AppointmentFormValues {
  return {
    ...createEmptyAppointmentValues('2026-12-10', '10:00', 'cli-1', 30),
    pacoteId: 'pkg-1',
    valorAcordado: '250',
    taxaDeslocamento: '50',
    taxaDeslocamentoRepassada: true,
    percentualEntrada: '30',
    ...overrides,
  }
}

describe('validateAppointmentForm com taxa de deslocamento', () => {
  it('inclui a taxa repassada no draft e calcula a entrada sobre o total', () => {
    const resultado = validateAppointmentForm(valores())

    expect(resultado.errors).toEqual({})
    expect(resultado.draft?.valorAcordado).toBe(250)
    expect(resultado.draft?.valorEntrada).toBe(75)
    expect(resultado.draft?.taxaDeslocamento).toBe(50)
    expect(resultado.draft?.taxaDeslocamentoRepassada).toBe(true)
  })

  it('mantém a taxa absorvida fora do total cobrado', () => {
    const resultado = validateAppointmentForm(
      valores({
        valorAcordado: '200',
        taxaDeslocamento: '50',
        taxaDeslocamentoRepassada: false,
      }),
    )

    expect(resultado.errors).toEqual({})
    expect(resultado.draft?.valorAcordado).toBe(200)
    expect(resultado.draft?.valorEntrada).toBe(60)
    expect(resultado.draft?.taxaDeslocamento).toBe(50)
    expect(resultado.draft?.taxaDeslocamentoRepassada).toBe(false)
  })

  it('rejeita taxa repassada maior que o valor total', () => {
    const resultado = validateAppointmentForm(
      valores({ valorAcordado: '40', taxaDeslocamento: '50' }),
    )

    expect(resultado.draft).toBeUndefined()
    expect(resultado.errors.taxaDeslocamento).toBe(
      'A taxa não pode ser maior que o valor total.',
    )
  })

  it('rejeita taxa negativa', () => {
    const resultado = validateAppointmentForm(
      valores({ taxaDeslocamento: '-5' }),
    )

    expect(resultado.draft).toBeUndefined()
    expect(resultado.errors.taxaDeslocamento).toBe('Informe uma taxa válida.')
  })
})
