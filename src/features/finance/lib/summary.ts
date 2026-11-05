import { isSameMonth } from 'date-fns'

import type { Contrato } from '@/domain/contracts'
import type { GaleriaEnsaio } from '@/domain/galleries'
import type { PagamentoEntrada, PagamentoStatus } from '@/domain/payments'
import type { AgendamentoEnsaio } from '@/domain/types'

export type EntradaSituacao = 'recebida' | 'pendente' | 'isenta' | 'cancelada'

export interface FinanceEntry {
  appointment: AgendamentoEnsaio
  contrato?: Contrato
  valorTotal: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  pagamento: PagamentoEntrada
  entradaStatus: PagamentoStatus
  entradaSituacao: EntradaSituacao
  valorFinal: number
  statusFinal: PagamentoStatus
  situacaoFinal: EntradaSituacao
  recebidoFinal: number
  valorExtras: number
  statusExtras: PagamentoStatus
  situacaoExtras: EntradaSituacao
  recebidoExtras: number
  recebido: number
  aReceber: number
}

export interface FinanceSummary {
  entries: FinanceEntry[]
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
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function situacaoFromStatus(status: PagamentoStatus): EntradaSituacao {
  switch (status) {
    case 'confirmado':
      return 'recebida'
    case 'pendente':
      return 'pendente'
    case 'isento':
      return 'isenta'
    case 'cancelado':
      return 'cancelada'
  }
}

/**
 * Resumo financeiro por competência: considera os ensaios cujo início
 * acontece no mês informado. Contratos vinculados têm prioridade sobre
 * os valores do agendamento, pois é onde o pagamento é confirmado.
 */
export function getMonthFinance(
  appointments: AgendamentoEnsaio[],
  contratos: Contrato[],
  month: Date,
  galerias: GaleriaEnsaio[] = [],
): FinanceSummary {
  const contratosById = new Map(contratos.map((contrato) => [contrato.id, contrato]))
  const contratosByAppointment = new Map(
    contratos
      .filter((contrato) => contrato.agendamentoId)
      .map((contrato) => [contrato.agendamentoId as string, contrato]),
  )
  const galeriasByAppointment = new Map(
    galerias.map((galeria) => [galeria.agendamentoId, galeria]),
  )

  const entries: FinanceEntry[] = appointments
    .filter(
      (appointment) =>
        appointment.status !== 'cancelado' &&
        isSameMonth(new Date(appointment.dataHoraInicio), month),
    )
    .sort(
      (a, b) =>
        new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime(),
    )
    .map((appointment) => {
      const contrato =
        (appointment.contratoId ? contratosById.get(appointment.contratoId) : undefined) ??
        contratosByAppointment.get(appointment.id)

      const valorTotal = contrato?.valorTotal ?? appointment.valorAcordado
      const valorEntrada = contrato?.valorEntrada ?? appointment.valorEntrada
      const percentualEntrada = contrato?.percentualEntrada ?? appointment.percentualEntrada
      const saldoRestante = Math.max(
        0,
        contrato?.saldoRestante ?? appointment.saldoRestante,
      )
      const pagamento = contrato?.pagamento ?? appointment.pagamentoEntrada
      const entradaStatus = contrato?.statusPagamento ?? appointment.pagamentoEntrada.status
      const recebidoEntrada = entradaStatus === 'confirmado' ? valorEntrada : 0

      const statusFinal =
        contrato?.statusPagamentoFinal ?? appointment.pagamentoFinal?.status ?? 'pendente'
      const recebidoFinal = statusFinal === 'confirmado' ? saldoRestante : 0

      const galeria = galeriasByAppointment.get(appointment.id)
      const pedidoExtras = galeria?.pedidoExtras
      const valorExtras = pedidoExtras?.valorTotal ?? 0
      const statusExtras: PagamentoStatus =
        pedidoExtras?.status === 'pago'
          ? 'confirmado'
          : pedidoExtras?.status === 'isento'
            ? 'isento'
            : pedidoExtras?.status === 'cancelado'
              ? 'cancelado'
              : 'pendente'
      const recebidoExtras = statusExtras === 'confirmado' ? valorExtras : 0
      const recebido = round(recebidoEntrada + recebidoFinal + recebidoExtras)

      return {
        appointment,
        contrato,
        valorTotal,
        valorEntrada,
        percentualEntrada,
        saldoRestante,
        pagamento,
        entradaStatus,
        entradaSituacao: situacaoFromStatus(entradaStatus),
        valorFinal: saldoRestante,
        statusFinal,
        situacaoFinal: situacaoFromStatus(statusFinal),
        recebidoFinal,
        valorExtras,
        statusExtras,
        situacaoExtras: situacaoFromStatus(statusExtras),
        recebidoExtras,
        recebido,
        aReceber: Math.max(0, valorTotal + valorExtras - recebido),
      }
    })

  const totalPrevisto = round(
    entries.reduce((sum, entry) => sum + entry.valorTotal + entry.valorExtras, 0),
  )
  const totalRecebido = round(entries.reduce((sum, entry) => sum + entry.recebido, 0))
  const totalEntradasRecebidas = round(
    entries.reduce(
      (sum, entry) =>
        sum +
        (entry.entradaStatus === 'confirmado' ? entry.valorEntrada : 0),
      0,
    ),
  )
  const totalEntradasPendentes = round(
    entries
      .filter((entry) => entry.entradaSituacao === 'pendente')
      .reduce((sum, entry) => sum + entry.valorEntrada, 0),
  )
  const totalSaldos = round(
    entries
      .filter((entry) => entry.situacaoFinal !== 'recebida')
      .reduce((sum, entry) => sum + entry.valorFinal, 0),
  )
  const totalSaldosRecebidos = round(
    entries.reduce((sum, entry) => sum + entry.recebidoFinal, 0),
  )
  const totalExtras = round(
    entries.reduce((sum, entry) => sum + entry.valorExtras, 0),
  )
  const totalExtrasRecebidos = round(
    entries.reduce((sum, entry) => sum + entry.recebidoExtras, 0),
  )
  const totalExtrasPendentes = round(
    entries
      .filter((entry) => entry.situacaoExtras === 'pendente')
      .reduce((sum, entry) => sum + entry.valorExtras, 0),
  )

  return {
    entries,
    quantidade: entries.length,
    quantidadeRecebidas: entries.filter(
      (entry) => entry.entradaSituacao === 'recebida',
    ).length,
    quantidadePendentes: entries.filter(
      (entry) => entry.entradaSituacao === 'pendente',
    ).length,
    totalPrevisto,
    totalRecebido,
    totalAReceber: round(Math.max(0, totalPrevisto - totalRecebido)),
    totalEntradasRecebidas,
    totalEntradasPendentes,
    totalSaldos,
    totalSaldosRecebidos,
    totalExtras,
    totalExtrasRecebidos,
    totalExtrasPendentes,
    quantidadeSaldosPendentes: entries.filter(
      (entry) => entry.situacaoFinal === 'pendente',
    ).length,
    quantidadeExtrasPendentes: entries.filter(
      (entry) => entry.situacaoExtras === 'pendente',
    ).length,
    ticketMedio: entries.length > 0 ? round(totalPrevisto / entries.length) : 0,
    percentualRecebido:
      totalPrevisto > 0 ? round((totalRecebido / totalPrevisto) * 100) : 0,
  }
}
