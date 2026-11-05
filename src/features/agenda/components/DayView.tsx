import { useMemo } from 'react'

import type { AgendamentoEnsaio } from '@/domain/types'
import { addDays, fromDateKey } from '@/shared/lib/date'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { TimeGrid } from '@/features/agenda/components/TimeGrid'

export function DayView({ appointments }: { appointments: AgendamentoEnsaio[] }) {
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const setSelectedDate = useAgendaStore((state) => state.setSelectedDate)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)

  const selected = useMemo(() => fromDateKey(selectedDate), [selectedDate])

  const swipeRef = useSwipe({
    onSwipeLeft: () => setSelectedDate(addDays(selected, 1)),
    onSwipeRight: () => setSelectedDate(addDays(selected, -1)),
  })

  return (
    <div ref={swipeRef} className="flex h-full min-h-0 flex-col bg-surface">
      <TimeGrid
        days={[selected]}
        appointments={appointments}
        selectedDay={selected}
        onSelectSlot={(day, time) => openCreateDrawer(day, time)}
        onSelectAppointment={(id) => openAppointmentDrawer(id)}
      />
    </div>
  )
}
