import { useMemo, useState } from 'react'
import { isSameMonth, startOfMonth } from 'date-fns'
import { Plus, Wallet } from 'lucide-react'

import type { FinanceEntry } from '@/features/finance/lib/summary'
import { getMonthFinance } from '@/features/finance/lib/summary'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useToastStore } from '@/shared/store/toastStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useCrmLookups } from '@/features/appointments/lib/lookups'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { FinanceAppointmentList } from '@/features/finance/components/FinanceAppointmentList'
import { FinanceMonthNavigator } from '@/features/finance/components/FinanceMonthNavigator'
import { FinanceSummaryCards } from '@/features/finance/components/FinanceSummaryCards'

export function FinancePage() {
  const appointments = useAppointmentStore((state) => state.appointments)
  const setDepositStatus = useAppointmentStore((state) => state.setDepositStatus)
  const contratos = useContractStore((state) => state.contratos)
  const galerias = useGalleryStore((state) => state.galerias)
  const confirmPayment = useContractStore((state) => state.confirmPayment)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const addToast = useToastStore((state) => state.addToast)
  const { clientesById, pacotesById } = useCrmLookups()

  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const summary = useMemo(
    () => getMonthFinance(appointments, contratos, month, galerias),
    [appointments, contratos, month, galerias],
  )

  const handleConfirm = (entry: FinanceEntry) => {
    if (entry.contrato) {
      if (entry.contrato.statusPagamento !== 'pendente') return
      confirmPayment(entry.contrato.id)
    } else {
      setDepositStatus(entry.appointment.id, 'confirmado')
    }

    addToast('Entrada marcada como recebida.')
  }

  const handleCreate = () => {
    const today = new Date()
    openCreateDrawer(isSameMonth(month, today) ? today : month)
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Planejamento financeiro
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Previsão dos ensaios e entradas recebidas no mês.
            </p>
          </div>

          <FinanceMonthNavigator month={month} onChange={setMonth} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <FinanceSummaryCards summary={summary} />

        {summary.entries.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhum ensaio neste mês"
            description="Crie um ensaio na agenda para começar a acompanhar a previsão de ganhos deste mês."
            action={
              <Button onClick={handleCreate}>
                <Plus className="size-4" />
                Novo ensaio
              </Button>
            }
          />
        ) : (
          <>
            <FinanceAppointmentList
              entries={summary.entries}
              clientesById={clientesById}
              pacotesById={pacotesById}
              onOpen={(appointmentId) => openAppointmentDrawer(appointmentId)}
              onConfirm={handleConfirm}
            />
            <p className="px-1 text-[11px] leading-relaxed text-muted">
              O valor “a receber” inclui entradas pendentes, saldos finais e fotos
              extras. O saldo final é registrado no ensaio ou no contrato; os extras
              são confirmados na galeria.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
