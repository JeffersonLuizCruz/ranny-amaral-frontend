import type { ComponentType, ReactNode } from 'react'
import {
  CalendarDays,
  Clock,
  MapPin,
  Package,
  QrCode,
  UserRound,
  Wallet,
} from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import {
  formatAppointmentDate,
  formatDuration,
  formatTimeRange,
  minutesBetween,
} from '@/shared/lib/date'
import {
  publicCard,
  publicDisplay,
} from '@/features/contracts/components/public/publicContractTheme'

interface PublicContractSummaryProps {
  contrato: Contrato
}

interface InfoCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  className?: string
}

function InfoCard({ icon: Icon, label, children, className }: InfoCardProps) {
  return (
    <div className={cn(publicCard, 'p-4', className)}>
      <div className="flex items-center gap-2 text-cyan-600">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-slate-700">{children}</div>
    </div>
  )
}

export function PublicContractSummary({ contrato }: PublicContractSummaryProps) {
  const { agendamento, estudio, pacote } = contrato.snapshot
  const dataLabel = agendamento
    ? formatAppointmentDate(agendamento.dataHoraInicio, agendamento.dataHoraFim)
    : 'Data a definir'
  const horaLabel = agendamento
    ? formatTimeRange(agendamento.dataHoraInicio, agendamento.dataHoraFim)
    : null
  const duracaoLabel = pacote
    ? formatDuration(pacote.duracaoMinutos)
    : agendamento
      ? formatDuration(minutesBetween(agendamento.dataHoraInicio, agendamento.dataHoraFim))
      : null
  const entradaRecebida =
    contrato.statusEntrada === 'confirmado' || contrato.entradaQuitada
  const entradaIsenta = contrato.statusEntrada === 'isento'
  const deslocamentoRepassado =
    Boolean(contrato.snapshot.deslocamento?.repassado) &&
    (contrato.snapshot.deslocamento?.valor ?? 0) > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={CalendarDays} label="Data do ensaio">
          {dataLabel}
          {horaLabel ? (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {horaLabel}
              {duracaoLabel ? ` · ${duracaoLabel}` : ''}
            </div>
          ) : null}
        </InfoCard>

        <InfoCard icon={MapPin} label="Local">
          {agendamento?.local || 'A definir'}
        </InfoCard>

        <InfoCard icon={Package} label="Pacote">
          {pacote?.nome || '—'}
          {pacote ? (
            <div className="mt-0.5 text-xs text-slate-500">
              Foto extra: {formatBRL(pacote.valorFotoExtra)}
            </div>
          ) : null}
        </InfoCard>

        <InfoCard icon={UserRound} label="Estúdio">
          {estudio.nome}
          {estudio.responsavel ? (
            <div className="mt-0.5 text-xs text-slate-500">{estudio.responsavel}</div>
          ) : null}
        </InfoCard>
      </div>

      <section className={cn(publicCard, 'overflow-hidden')}>
        <div className="flex items-center gap-2 border-b border-cyan-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className={`${publicDisplay} text-lg font-semibold text-cyan-950`}>Valores</h2>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Valor total do serviço</span>
            <span className="font-semibold text-slate-800">
              {formatBRL(contrato.valorTotal)}
            </span>
          </div>

          {deslocamentoRepassado ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Deslocamento</span>
              <span className="font-medium text-slate-700">
                {formatBRL(contrato.snapshot.deslocamento?.valor ?? 0)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-100 to-rose-100 px-4 py-3">
            <span className="text-sm font-semibold text-orange-900">
              {entradaIsenta
                ? 'Entrada isenta'
                : entradaRecebida
                  ? 'Entrada já recebida'
                  : `Reserva (${contrato.percentualEntrada}%)`}
            </span>
            <span className="text-lg font-bold text-orange-900">
              {formatBRL(contrato.valorEntrada)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Restante a pagar no final do ensaio</span>
            <span className="font-semibold text-slate-800">
              {formatBRL(contrato.saldoRestante)}
            </span>
          </div>

          {contrato.formaPagamento ? (
            <p className="text-xs text-slate-500">
              Forma de pagamento: {contrato.formaPagamento}
            </p>
          ) : null}
        </div>

        {!entradaRecebida && !entradaIsenta && estudio.chavePix ? (
          <div className="flex items-start gap-3 border-t border-cyan-100 bg-cyan-50/60 px-5 py-4">
            <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
            <div className="text-sm">
              <p className="font-medium text-cyan-950">Pagamento via PIX</p>
              <p className="break-words text-slate-600">
                Chave: <span className="font-semibold">{estudio.chavePix}</span>
              </p>
              {estudio.instrucoesPagamento ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {estudio.instrucoesPagamento}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
