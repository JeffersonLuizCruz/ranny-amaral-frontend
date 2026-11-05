import type { AgendamentoEnsaio } from '@/domain/types'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { DayView } from '@/features/agenda/components/DayView'
import { MonthView } from '@/features/agenda/components/MonthView'
import { WeekView } from '@/features/agenda/components/WeekView'

export function CalendarView({ appointments }: { appointments: AgendamentoEnsaio[] }) {
  const view = useAgendaStore((state) => state.view)

  if (view === 'week') return <WeekView appointments={appointments} />
  if (view === 'day') return <DayView appointments={appointments} />
  return <MonthView appointments={appointments} />
}
