import { useEffect, useMemo, useRef } from 'react'
import type { MouseEvent } from 'react'
import { format, getDay } from 'date-fns'

import type { AgendamentoEnsaio } from '@/domain/types'
import { cn } from '@/shared/lib/cn'
import {
  formatDayLong,
  isSameDay,
  isToday,
  WEEKDAY_LABELS,
} from '@/shared/lib/date'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useNow } from '@/shared/hooks/useNow'
import { useCrmLookups } from '@/features/appointments/lib/lookups'
import { AppointmentBlock } from '@/features/agenda/components/AppointmentBlock'
import { layoutDayAppointments } from '@/features/agenda/lib/layout'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

interface TimeGridProps {
  days: Date[]
  appointments: AgendamentoEnsaio[]
  selectedDay: Date
  onSelectDay?: (day: Date) => void
  onSelectSlot: (day: Date, time: string) => void
  onSelectAppointment: (appointmentId: string) => void
  hideDayHeader?: boolean
}

export function TimeGrid({
  days,
  appointments,
  selectedDay,
  onSelectDay,
  onSelectSlot,
  onSelectAppointment,
  hideDayHeader = false,
}: TimeGridProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const hourHeight = isDesktop ? 64 : 56
  const totalHeight = 24 * hourHeight
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useNow()
  const { clientesById, pacotesById } = useCrmLookups()

  const columns = `3.75rem repeat(${days.length}, minmax(0, 1fr))`

  const buckets = useMemo(
    () =>
      days.map((day) => ({
        day,
        layouts: layoutDayAppointments(appointments, day),
      })),
    [appointments, days],
  )

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const selectedIsToday = isToday(selectedDay)

  // Start near the working day (or two hours before "now").
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const focusHour = selectedIsToday ? Math.max(0, new Date().getHours() - 2) : 7
    element.scrollTop = focusHour * hourHeight
  }, [hourHeight, selectedIsToday])

  const handleSlotClick = (event: MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = Math.max(0, Math.min(event.clientY - rect.top, totalHeight))
    const rawMinutes = (offsetY / hourHeight) * 60
    const snapped = Math.min(23 * 60 + 30, Math.floor(rawMinutes / 30) * 30)
    const hours = String(Math.floor(snapped / 60)).padStart(2, '0')
    const minutes = String(snapped % 60).padStart(2, '0')
    onSelectSlot(day, `${hours}:${minutes}`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 border-b border-line">
        {!hideDayHeader ? (
          <div className="grid" style={{ gridTemplateColumns: columns }}>
            <div aria-hidden="true" />
            {days.map((day) => (
              <DayHeader
                key={`header-${day.toISOString()}`}
                day={day}
                selected={isSameDay(day, selectedDay)}
                onSelect={onSelectDay}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="thin-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="grid" style={{ gridTemplateColumns: columns, height: totalHeight }}>
          <div aria-hidden="true" className="relative bg-surface">
            {HOURS.map((hour) =>
              hour === 0 ? null : (
                <span
                  key={`label-${hour}`}
                  className="tabular absolute right-2 -translate-y-1/2 text-[10px] text-muted"
                  style={{ top: hour * hourHeight }}
                >
                  {String(hour).padStart(2, '0')}:00
                </span>
              ),
            )}
          </div>

          {buckets.map(({ day, layouts }) => {
            const today = isToday(day)

            return (
              <div
                key={`column-${day.toISOString()}`}
                onClick={(event) => handleSlotClick(event, day)}
                className={cn(
                  'relative cursor-pointer border-l border-line transition-colors hover:bg-brand-50/20',
                  today && 'bg-brand-50/20',
                )}
                style={{ height: totalHeight }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={`line-${hour}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 border-t border-line/80"
                    style={{ top: hour * hourHeight }}
                  />
                ))}

                {today ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-20"
                    style={{ top: (nowMinutes / 60) * hourHeight }}
                  >
                    <div className="relative h-px bg-red-500">
                      <span className="absolute -left-1 -top-[3px] size-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                ) : null}

                {layouts.map((layout) => (
                  <AppointmentBlock
                    key={layout.appointment.id}
                    layout={layout}
                    hourHeight={hourHeight}
                    pacote={pacotesById.get(layout.appointment.pacoteId)}
                    cliente={
                      layout.appointment.clienteId
                        ? clientesById.get(layout.appointment.clienteId)
                        : undefined
                    }
                    contatoNome={layout.appointment.contato?.nome}
                    onClick={() => onSelectAppointment(layout.appointment.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface DayHeaderProps {
  day: Date
  selected: boolean
  onSelect?: (day: Date) => void
}

function DayHeader({ day, selected, onSelect }: DayHeaderProps) {
  const today = isToday(day)
  const className = cn(
    'flex flex-col items-center gap-0.5 border-l border-line py-2 transition-colors',
    selected && 'bg-brand-50/40',
    onSelect && 'cursor-pointer hover:bg-slate-50',
  )

  const content = (
    <>
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wide',
          today ? 'text-brand-700' : 'text-muted',
        )}
      >
        {WEEKDAY_LABELS[getDay(day)]}
      </span>
      <span
        className={cn(
          'tabular grid size-9 place-items-center rounded-full text-lg font-medium',
          today && 'bg-brand-600 text-white shadow-sm',
          !today && selected && 'bg-brand-50 text-brand-800',
          !today && !selected && 'text-ink',
        )}
      >
        {format(day, 'd')}
      </span>
    </>
  )

  if (!onSelect) {
    return (
      <div className={className} aria-current={today ? 'date' : undefined}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-label={formatDayLong(day)}
      aria-current={today ? 'date' : undefined}
      className={className}
    >
      {content}
    </button>
  )
}
