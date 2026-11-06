import type { AgendamentoStatus } from '@/domain/types'
import type { PagamentoStatus } from '@/domain/payments'
import { http } from '@/shared/api/httpClient'

export interface EntradaFinanceira {
  agendamentoId: string
  contratoId?: string
  clienteId?: string
  clienteNome?: string
  pacoteId?: string
  pacoteNome?: string
  dataHoraInicio: string
  dataHoraFim: string
  statusAgendamento: AgendamentoStatus
  valorTotal: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  statusEntrada: PagamentoStatus
  statusFinal: PagamentoStatus
  valorExtras: number
  statusExtras?: 'pendente' | 'pago' | 'isento' | 'cancelado'
  recebidoEntrada: number
  recebidoFinal: number
  recebidoExtras: number
  recebido: number
  aReceber: number
}

export interface ResumoFinanceiroMensal {
  mes: string
  quantidade: number
  quantidadeRecebidas: number
  quantidadePendentes: number
  totalPrevisto: number
  totalRecebido: number
  totalAReceber: number
  totalEntradasRecebidas: number
  totalEntradasPendentes: number
  totalSaldos: number
  totalSaldosRecebidos: number
  totalExtras: number
  totalExtrasRecebidos: number
  totalExtrasPendentes: number
  quantidadeSaldosPendentes: number
  quantidadeExtrasPendentes: number
  ticketMedio: number
  percentualRecebido: number
  entradas: EntradaFinanceira[]
}

export async function resumoMensal(mes: string): Promise<ResumoFinanceiroMensal> {
  return http.get<ResumoFinanceiroMensal>(
    `/financeiro/mensal?mes=${encodeURIComponent(mes)}`,
  )
}
