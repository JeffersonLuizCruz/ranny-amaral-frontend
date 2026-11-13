import type { Contrato } from '@/domain/contracts'
import type { GaleriaEnsaio, GaleriaStatus } from '@/domain/galleries'
import type { AgendamentoEnsaio, Cliente } from '@/domain/types'

export type StatusFinanceiroCliente =
  | 'sem_contrato'
  | 'em_dia'
  | 'pendente'
  | 'aguardando_aceite'

export const STATUS_FINANCEIRO_META: Record<
  StatusFinanceiroCliente,
  { label: string; badge: string; dot: string }
> = {
  em_dia: {
    label: 'Em dia',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  pendente: {
    label: 'Pendência',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  aguardando_aceite: {
    label: 'Aguardando aceite',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  sem_contrato: {
    label: 'Sem contrato',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
}

export interface ResumoCliente {
  totalEnsaios: number
  totalEnsaiosVinculados: number
  ensaiosRealizados: number
  ensaios: AgendamentoEnsaio[]
  ensaiosSemContrato: AgendamentoEnsaio[]
  proximoEnsaio?: AgendamentoEnsaio
  ultimoEnsaio?: AgendamentoEnsaio
  contratos: Contrato[]
  galerias: GaleriaEnsaio[]
  galeriaAtiva?: GaleriaEnsaio
  ultimaGaleria?: GaleriaEnsaio
  contratado: number
  recebido: number
  pendente: number
  statusFinanceiro: StatusFinanceiroCliente
  recorrente: boolean
  ultimaAtividade?: string
}

interface MontarResumoParams {
  cliente: Cliente
  appointments: AgendamentoEnsaio[]
  contratos: Contrato[]
  galerias: GaleriaEnsaio[]
  agora?: Date
}

const GALERIA_ATIVA: GaleriaStatus[] = [
  'aguardando_upload',
  'em_selecao',
  'selecao_enviada',
  'em_edicao',
]

function toTime(value?: string): number {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}

function arredondar(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Monta a visão do cliente usada no card e na ficha.
 *
 * Os valores financeiros vêm prontos do backend (contratos e ensaios); aqui só
 * somamos e evitamos contar duas vezes o mesmo ensaio quando existe contrato.
 */
export function montarResumoCliente({
  cliente,
  appointments,
  contratos,
  galerias,
  agora = new Date(),
}: MontarResumoParams): ResumoCliente {
  const ensaiosDoCliente = appointments.filter(
    (appointment) => appointment.clienteId === cliente.id,
  )
  const agendamentoIds = new Set(
    ensaiosDoCliente.map((appointment) => appointment.id),
  )

  const contratosDoCliente = contratos.filter(
    (contrato) =>
      contrato.clienteId === cliente.id ||
      (contrato.agendamentoId != null && agendamentoIds.has(contrato.agendamentoId)),
  )
  const contratosAtivos = contratosDoCliente.filter(
    (contrato) => contrato.statusAceite !== 'cancelado',
  )
  const contratosAtivosPorAgendamento = new Set(
    contratosAtivos
      .map((contrato) => contrato.agendamentoId)
      .filter((id): id is string => Boolean(id)),
  )

  const ensaiosAtivos = ensaiosDoCliente.filter(
    (appointment) => appointment.status !== 'cancelado',
  )
  const ensaiosSemContrato = ensaiosAtivos.filter(
    (appointment) => !contratosAtivosPorAgendamento.has(appointment.id),
  )

  const contratado = arredondar(
    contratosAtivos.reduce((total, contrato) => total + contrato.valorTotal, 0) +
      ensaiosSemContrato.reduce(
        (total, appointment) => total + appointment.valorAcordado,
        0,
      ),
  )
  const recebido = arredondar(
    contratosAtivos.reduce(
      (total, contrato) => total + contrato.valorRecebido,
      0,
    ) +
      ensaiosSemContrato.reduce(
        (total, appointment) => total + appointment.valorRecebido,
        0,
      ),
  )
  const pendente = arredondar(
    contratosAtivos.reduce(
      (total, contrato) => total + contrato.valorPendente,
      0,
    ) +
      ensaiosSemContrato.reduce(
        (total, appointment) => total + appointment.valorPendente,
        0,
      ),
  )

  const contratosAguardandoAceite = contratosAtivos.filter((contrato) =>
    ['rascunho', 'pendente', 'expirado'].includes(contrato.statusAceite),
  )
  const statusFinanceiro: StatusFinanceiroCliente =
    contratosAguardandoAceite.length > 0
      ? 'aguardando_aceite'
      : pendente > 0
        ? 'pendente'
        : contratado > 0
          ? 'em_dia'
          : 'sem_contrato'

  const agoraMs = agora.getTime()
  const ensaiosOrdenados = [...ensaiosAtivos].sort(
    (a, b) => toTime(b.dataHoraInicio) - toTime(a.dataHoraInicio),
  )
  const proximoEnsaio = [...ensaiosAtivos]
    .filter((appointment) => toTime(appointment.dataHoraInicio) >= agoraMs)
    .sort(
      (a, b) => toTime(a.dataHoraInicio) - toTime(b.dataHoraInicio),
    )[0]
  const ultimoEnsaio =
    ensaiosAtivos
      .filter((appointment) => toTime(appointment.dataHoraInicio) < agoraMs)
      .sort(
        (a, b) => toTime(b.dataHoraInicio) - toTime(a.dataHoraInicio),
      )[0] ?? ensaiosOrdenados[0]

  const galeriasDoCliente = galerias
    .filter((galeria) => agendamentoIds.has(galeria.agendamentoId))
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
  const ultimaGaleria = galeriasDoCliente[0]
  const galeriaAtiva =
    galeriasDoCliente.find((galeria) =>
      GALERIA_ATIVA.includes(galeria.status),
    ) ?? ultimaGaleria

  const contratosOrdenados = [...contratosDoCliente].sort(
    (a, b) => toTime(b.dataEmissao) - toTime(a.dataEmissao),
  )

  const ultimaAtividadeMs = Math.max(
    0,
    toTime(cliente.updatedAt),
    ...ensaiosDoCliente.map((appointment) => toTime(appointment.updatedAt)),
    ...contratosDoCliente.map((contrato) => toTime(contrato.updatedAt)),
    ...galeriasDoCliente.map((galeria) => toTime(galeria.updatedAt)),
  )

  return {
    totalEnsaios: ensaiosAtivos.length,
    totalEnsaiosVinculados: ensaiosDoCliente.length,
    ensaiosRealizados: ensaiosAtivos.filter(
      (appointment) => appointment.status === 'realizado',
    ).length,
    ensaios: ensaiosOrdenados,
    ensaiosSemContrato,
    proximoEnsaio,
    ultimoEnsaio,
    contratos: contratosOrdenados,
    galerias: galeriasDoCliente,
    galeriaAtiva,
    ultimaGaleria,
    contratado,
    recebido,
    pendente,
    statusFinanceiro,
    recorrente: ensaiosAtivos.length >= 3,
    ultimaAtividade:
      ultimaAtividadeMs > 0
        ? new Date(ultimaAtividadeMs).toISOString()
        : undefined,
  }
}
