import { useMemo } from 'react'
import { getDay } from 'date-fns'

import type { AgendamentoEnsaio, PacoteFotografico } from '@/domain/types'
import { cn } from '@/shared/lib/cn'
import {
  addDays,
  appointmentsForDay,
  fromDateKey,
  getWeekDays,
  isSameDay,
  isToday,
  WEEKDAY_LABELS,
} from '@/shared/lib/date'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useCrmLookups } from '@/features/appointments/lib/lookups'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { TimeGrid } from '@/features/agenda/components/TimeGrid'

export function WeekView({ appointments }: { appointments: AgendamentoEnsaio[] }) {
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const setSelectedDate = useAgendaStore((state) => state.setSelectedDate)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { pacotesById } = useCrmLookups()

  const selected = useMemo(() => fromDateKey(selectedDate), [selectedDate])
  const weekDays = useMemo(() => getWeekDays(selected), [selected])

  const swipeRef = useSwipe({
    onSwipeLeft: () => setSelectedDate(addDays(selected, 1)),
    onSwipeRight: () => setSelectedDate(addDays(selected, -1)),
  })

  if (!isDesktop) {
    return (
      <div ref={swipeRef} className="flex h-full min-h-0 flex-col bg-surface">
        <WeekStrip
          days={weekDays}
          selected={selected}
          appointments={appointments}
          pacotesById={pacotesById}
          onSelect={(day) => setSelectedDate(day)}
        />
        <div className="min-h-0 flex-1">
          <TimeGrid
            days={[selected]}
            appointments={appointments}
            selectedDay={selected}
            onSelectSlot={(day, time) => openCreateDrawer(day, time)}
            onSelectAppointment={(id) => openAppointmentDrawer(id)}
            hideDayHeader
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <TimeGrid
        days={weekDays}
        appointments={appointments}
        selectedDay={selected}
        onSelectDay={(day) => setSelectedDate(day)}
        onSelectSlot={(day, time) => openCreateDrawer(day, time)}
        onSelectAppointment={(id) => openAppointmentDrawer(id)}
      />
    </div>
  )
}

interface WeekStripProps {
  days: Date[]
  selected: Date
  appointments: AgendamentoEnsaio[]
  pacotesById: Map<string, PacoteFotografico>
  onSelect: (day: Date) => void
}

function WeekStrip({ days, selected, appointments, pacotesById, onSelect }: WeekStripProps) {
  return (
    <div className="grid shrink-0 grid-cols-7 border-b border-line bg-surface px-1 py-1.5">
      {days.map((day) => {
        const dayAppointments = appointmentsForDay(appointments, day)
        const active = isSameDay(day, selected)
        const today = isToday(day)

        return (
          <button
            key={`strip-${day.toISOString()}`}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(day)}
            className="flex flex-col items-center gap-0.5 rounded-xl py-1 transition-colors hover:bg-slate-50"
          >
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wide',
                active ? 'text-brand-700' : 'text-muted',
              )}
            >
              {WEEKDAY_LABELS[getDay(day)]}
            </span>
            <span
              className={cn(
                'tabular grid size-8 place-items-center rounded-full text-sm font-medium transition-colors',
                active && 'bg-brand-600 text-white shadow-sm',
                !active && today && 'text-brand-700 ring-1 ring-brand-200',
                !active && !today && 'text-ink',
              )}
            >
              {day.getDate()}
            </span>
            <span className="flex h-1 items-center gap-0.5" aria-hidden="true">
              {dayAppointments.slice(0, 3).map((appointment) => (
                <span
                  key={appointment.id}
                  className="size-1 rounded-full"
                  style={{
                    backgroundColor: pacotesById.get(appointment.pacoteId)?.corHex ?? '#94a3b8',
                  }}
                />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
