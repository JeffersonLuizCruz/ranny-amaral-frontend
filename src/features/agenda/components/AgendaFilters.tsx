import { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { STATUS_META, STATUS_ORDER } from '@/domain/constants'
import { cn } from '@/shared/lib/cn'
import { useActiveFilterCount } from '@/features/agenda/lib/filters'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { usePackageStore } from '@/features/packages/store/packageStore'

export function AgendaFilters({ className }: { className?: string }) {
  const hiddenStatuses = useAgendaStore((state) => state.filters.hiddenStatuses)
  const hiddenPackageIds = useAgendaStore((state) => state.filters.hiddenPackageIds)
  const toggleStatusFilter = useAgendaStore((state) => state.toggleStatusFilter)
  const togglePackageFilter = useAgendaStore((state) => state.togglePackageFilter)
  const clearFilters = useAgendaStore((state) => state.clearFilters)
  const activeCount = useActiveFilterCount()

  const appointments = useAppointmentStore((state) => state.appointments)
  const pacotes = usePackageStore((state) => state.pacotes)

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const appointment of appointments) {
      map.set(appointment.status, (map.get(appointment.status) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const packageCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const appointment of appointments) {
      map.set(appointment.pacoteId, (map.get(appointment.pacoteId) ?? 0) + 1)
    }
    return map
  }, [appointments])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <SlidersHorizontal className="size-3.5" />
          Filtros
        </p>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-semibold text-brand-700 transition hover:underline"
          >
            Limpar
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted">Status</p>
        <ul className="space-y-0.5">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status]
            const checked = !hiddenStatuses.includes(status)

            return (
              <li key={status}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-0.5 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStatusFilter(status)}
                    className="size-3.5 rounded border-line accent-brand-600"
                  />
                  <span className={cn('size-2 rounded-full', meta.dot)} />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{meta.label}</span>
                  <span className="tabular text-[10px] text-muted">
                    {statusCounts.get(status) ?? 0}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted">Pacotes</p>
        <ul className="space-y-0.5">
          {pacotes.map((pacote) => {
            const checked = !hiddenPackageIds.includes(pacote.id)

            return (
              <li key={pacote.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-0.5 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePackageFilter(pacote.id)}
                    className="size-3.5 rounded border-line accent-brand-600"
                  />
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: pacote.corHex }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">
                    {pacote.nome}
                    {!pacote.ativo ? (
                      <span className="ml-1 text-[10px] text-muted">(arquivado)</span>
                    ) : null}
                  </span>
                  <span className="tabular text-[10px] text-muted">
                    {packageCounts.get(pacote.id) ?? 0}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
