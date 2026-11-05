import { useMemo } from 'react'
import { format, isSameMonth } from 'date-fns'
import { Plus } from 'lucide-react'

import { STATUS_META } from '@/domain/constants'
import type { AgendamentoEnsaio } from '@/domain/types'
import { cn } from '@/shared/lib/cn'
import { hexToRgba } from '@/shared/lib/colors'
import {
  appointmentsForDay,
  formatDayLong,
  formatTime,
  fromDateKey,
  getMonthMatrix,
  isSameDay,
  isToday,
  WEEKDAY_INITIALS,
  WEEKDAY_LABELS,
} from '@/shared/lib/date'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useCrmLookups } from '@/features/appointments/lib/lookups'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'

const MAX_VISIBLE_APPOINTMENTS = 3

export function MonthView({ appointments }: { appointments: AgendamentoEnsaio[] }) {
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const setSelectedDate = useAgendaStore((state) => state.setSelectedDate)
  const setView = useAgendaStore((state) => state.setView)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { clientesById, pacotesById } = useCrmLookups()

  const selected = useMemo(() => fromDateKey(selectedDate), [selectedDate])
  const days = useMemo(() => getMonthMatrix(selected), [selected])

  const openDay = (day: Date) => {
    setSelectedDate(day)
    if (!isDesktop) setView('day')
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="grid shrink-0 grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label + index}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{WEEKDAY_INITIALS[index]}</span>
          </div>
        ))}
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-[540px] grid-cols-7 grid-rows-6 md:h-full">
          {days.map((day) => {
            const dayAppointments = appointmentsForDay(appointments, day)
            const inMonth = isSameMonth(day, selected)
            const today = isToday(day)
            const isSelected = isSameDay(day, selected)
            const visible = dayAppointments.slice(0, MAX_VISIBLE_APPOINTMENTS)
            const hiddenCount = dayAppointments.length - visible.length

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'group relative flex min-h-[86px] min-w-0 flex-col border-b border-r border-line md:min-h-0',
                  !inMonth && 'bg-slate-50/60',
                  isSelected && 'bg-brand-50/40',
                )}
              >
                <button
                  type="button"
                  onClick={() => openDay(day)}
                  onDoubleClick={() => openCreateDrawer(day)}
                  aria-label={`Abrir ${formatDayLong(day)}`}
                  className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                />

                <div className="pointer-events-none relative z-10 flex items-start justify-between p-1.5">
                  <span
                    className={cn(
                      'tabular grid size-7 place-items-center rounded-full text-xs font-medium transition-colors',
                      !inMonth && 'text-slate-400',
                      inMonth && !today && !isSelected && 'text-ink',
                      today && 'bg-brand-600 font-semibold text-white shadow-sm',
                      !today && isSelected && 'bg-brand-100 text-brand-800',
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openCreateDrawer(day)
                    }}
                    aria-label={`Criar ensaio em ${formatDayLong(day)}`}
                    className="pointer-events-auto hidden size-6 place-items-center rounded-full text-muted opacity-0 transition hover:bg-white hover:text-brand-700 focus-visible:opacity-100 group-hover:opacity-100 sm:grid"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-1 pb-1">
                  {visible.map((appointment) => {
                    const cliente = appointment.clienteId
                      ? clientesById.get(appointment.clienteId)
                      : undefined
                    const pacote = pacotesById.get(appointment.pacoteId)
                    const color = pacote?.corHex ?? '#64748b'
                    const status = STATUS_META[appointment.status]
                    const nomeContato =
                      cliente?.nome ?? appointment.contato?.nome ?? 'Cliente'

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        title={`${nomeContato} · ${pacote?.nome ?? 'Pacote'} · ${
                          status.label
                        } · ${formatTime(appointment.dataHoraInicio)}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openAppointmentDrawer(appointment.id)
                        }}
                        style={{
                          backgroundColor: hexToRgba(color, 0.14),
                          borderLeftColor: color,
                        }}
                        className={cn(
                          'pointer-events-auto hidden w-full truncate rounded border-l-[3px] px-1.5 py-0.5 text-left text-[10px] font-medium text-ink ring-1 ring-inset ring-transparent transition hover:brightness-95 sm:block',
                          appointment.status === 'cancelado' && 'line-through opacity-60',
                          appointment.status === 'reservado' &&
                            'border border-dashed border-l-[3px] border-slate-300',
                        )}
                      >
                        <span className="tabular mr-1 opacity-70">
                          {formatTime(appointment.dataHoraInicio)}
                        </span>
                        {nomeContato}
                        <span
                          className={cn('ml-1 inline-block size-1.5 rounded-full', status.dot)}
                          aria-hidden="true"
                        />
                      </button>
                    )
                  })}

                  {hiddenCount > 0 ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedDate(day)
                        setView('day')
                      }}
                      className="pointer-events-auto hidden w-full rounded px-1.5 py-0.5 text-left text-[10px] font-semibold text-brand-700 transition hover:bg-brand-50 sm:block"
                    >
                      +{hiddenCount} mais
                    </button>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1 px-1 pt-1 sm:hidden">
                    {dayAppointments.slice(0, 4).map((appointment) => {
                      const pacote = pacotesById.get(appointment.pacoteId)
                      return (
                        <span
                          key={appointment.id}
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: pacote?.corHex ?? '#64748b' }}
                        />
                      )
                    })}
                    {dayAppointments.length > 4 ? (
                      <span className="text-[9px] font-medium text-muted">
                        +{dayAppointments.length - 4}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
