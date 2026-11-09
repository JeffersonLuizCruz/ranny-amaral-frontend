import { useMemo } from 'react'

import type { AgendamentoEnsaio } from '@/domain/types'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { paymentStateOf } from '@/features/agenda/lib/paymentState'

export function useFilteredAppointments(): AgendamentoEnsaio[] {
  const appointments = useAppointmentStore((state) => state.appointments)
  const hiddenStatuses = useAgendaStore((state) => state.filters.hiddenStatuses)
  const hiddenPackageIds = useAgendaStore((state) => state.filters.hiddenPackageIds)
  const hiddenPaymentStates = useAgendaStore((state) => state.filters.hiddenPaymentStates)

  return useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          !hiddenStatuses.includes(appointment.status) &&
          !hiddenPackageIds.includes(appointment.pacoteId) &&
          !hiddenPaymentStates.includes(paymentStateOf(appointment)),
      ),
    [appointments, hiddenPackageIds, hiddenPaymentStates, hiddenStatuses],
  )
}

export function useActiveFilterCount(): number {
  const hiddenStatuses = useAgendaStore((state) => state.filters.hiddenStatuses)
  const hiddenPackageIds = useAgendaStore((state) => state.filters.hiddenPackageIds)
  const hiddenPaymentStates = useAgendaStore((state) => state.filters.hiddenPaymentStates)

  return hiddenStatuses.length + hiddenPackageIds.length + hiddenPaymentStates.length
}
