import { useMemo } from 'react'

import type { AgendamentoEnsaio } from '@/domain/types'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'

export function useFilteredAppointments(): AgendamentoEnsaio[] {
  const appointments = useAppointmentStore((state) => state.appointments)
  const hiddenStatuses = useAgendaStore((state) => state.filters.hiddenStatuses)
  const hiddenPackageIds = useAgendaStore((state) => state.filters.hiddenPackageIds)

  return useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          !hiddenStatuses.includes(appointment.status) &&
          !hiddenPackageIds.includes(appointment.pacoteId),
      ),
    [appointments, hiddenPackageIds, hiddenStatuses],
  )
}

export function useActiveFilterCount(): number {
  const hiddenStatuses = useAgendaStore((state) => state.filters.hiddenStatuses)
  const hiddenPackageIds = useAgendaStore((state) => state.filters.hiddenPackageIds)

  return hiddenStatuses.length + hiddenPackageIds.length
}
