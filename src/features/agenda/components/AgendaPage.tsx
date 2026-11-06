import { X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { useActiveFilterCount, useFilteredAppointments } from '@/features/agenda/lib/filters'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { CalendarView } from '@/features/agenda/components/CalendarView'

export function AgendaPage() {
  const appointments = useFilteredAppointments()
  const activeFilterCount = useActiveFilterCount()
  const clearFilters = useAgendaStore((state) => state.clearFilters)
  const carregando = useAppointmentStore((state) => state.carregando)
  const carregado = useAppointmentStore((state) => state.carregado)

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      {activeFilterCount > 0 ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-brand-50/50 px-3 py-1.5 text-[11px] text-brand-800 sm:px-4">
          <span className="font-medium">
            {activeFilterCount} {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}
          </span>
          <span className="text-brand-300">·</span>
          <span className="min-w-0 flex-1 truncate text-brand-700">
            {appointments.length}{' '}
            {appointments.length === 1 ? 'ensaio visível' : 'ensaios visíveis'}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition hover:bg-brand-100',
            )}
          >
            <X className="size-3" />
            Limpar
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {carregando && !carregado ? (
          <p className="py-10 text-center text-sm text-muted">Carregando agenda…</p>
        ) : (
          <CalendarView appointments={appointments} />
        )}
      </div>
    </div>
  )
}
