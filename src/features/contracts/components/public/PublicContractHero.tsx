import { CalendarDays, MapPin, Package, Palmtree } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import {
  formatAppointmentDate,
  formatDuration,
  formatTimeRange,
  minutesBetween,
} from '@/shared/lib/date'
import { PublicContractBrand } from '@/features/contracts/components/public/PublicContractBrand'
import { publicDisplay } from '@/features/contracts/components/public/publicContractTheme'

interface PublicContractHeroProps {
  contrato: Contrato
}

export function PublicContractHero({ contrato }: PublicContractHeroProps) {
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

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-500 to-teal-400 p-6 text-white shadow-lg shadow-cyan-200/60 sm:p-9">
      <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      <div className="relative">
        <PublicContractBrand nome={estudio.nome} className="mb-5" />

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          <Palmtree className="h-4 w-4" />
          Aceite de contrato
        </div>

        <h1 className={`${publicDisplay} mt-3 text-3xl font-bold leading-tight sm:text-4xl`}>
          {estudio.nome || 'Estúdio de Fotografia'}
        </h1>
        <p className="mt-1 text-sm text-white/85">
          Contrato {contrato.numero} · Termo de Prestação de Serviços Fotográficos
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5" />
            {dataLabel}
            {horaLabel ? ` às ${horaLabel}` : ''}
            {duracaoLabel ? ` · ${duracaoLabel}` : ''}
          </span>
          {agendamento?.local ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {agendamento.local}
            </span>
          ) : null}
          {pacote?.nome ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur">
              <Package className="h-3.5 w-3.5" />
              {pacote.nome}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
