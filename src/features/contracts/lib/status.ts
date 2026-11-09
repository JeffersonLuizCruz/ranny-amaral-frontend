import type { AgendamentoStatus } from '@/domain/types'
import type { Contrato } from '@/domain/contracts'

export function appointmentStatusFromContract(contrato: Contrato): AgendamentoStatus {
  if (
    contrato.statusAceite === 'cancelado' ||
    contrato.statusEntrada === 'cancelado'
  ) {
    return 'cancelado'
  }

  if (
    contrato.statusAceite === 'aceito' &&
    ['confirmado', 'isento'].includes(contrato.statusEntrada)
  ) {
    return 'confirmado'
  }

  return 'reservado'
}
