import type { AgendaPaymentFilter, AgendamentoEnsaio } from '@/domain/types'

/** Estado financeiro derivado usado pelos filtros da agenda. */
export function paymentStateOf(
  appointment: Pick<AgendamentoEnsaio, 'quitado' | 'entradaQuitada'>,
): AgendaPaymentFilter {
  if (appointment.quitado) return 'quitado'
  if (!appointment.entradaQuitada) return 'entrada_pendente'
  return 'saldo_pendente'
}
