import { useEffect, useState } from 'react'
import { format, isSameMonth, startOfMonth } from 'date-fns'
import { Plus, Wallet } from 'lucide-react'

import type { EntradaFinanceira } from '@/features/finance/api/financeiroApi'
import { atualizarPagamentoEntrada } from '@/features/appointments/api/agendaApi'
import { confirmarPagamento } from '@/features/contracts/api/contratosApi'
import { useFinanceStore } from '@/features/finance/store/financeStore'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { FinanceAppointmentList } from '@/features/finance/components/FinanceAppointmentList'
import { FinanceMonthNavigator } from '@/features/finance/components/FinanceMonthNavigator'
import { FinanceSummaryCards } from '@/features/finance/components/FinanceSummaryCards'

export function FinancePage() {
  const resumo = useFinanceStore((state) => state.resumo)
  const carregando = useFinanceStore((state) => state.carregando)
  const erro = useFinanceStore((state) => state.erro)
  const carregarResumo = useFinanceStore((state) => state.carregarResumo)
  const recarregar = useFinanceStore((state) => state.recarregar)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const addToast = useToastStore((state) => state.addToast)

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const mes = format(month, 'yyyy-MM')

  useEffect(() => {
    void carregarResumo(mes).catch(() => undefined)
  }, [carregarResumo, mes])

  const handleConfirm = async (entry: EntradaFinanceira) => {
    try {
      if (entry.contratoId) {
        if (entry.statusEntrada !== 'pendente') return
        await confirmarPagamento(entry.contratoId)
      } else {
        await atualizarPagamentoEntrada(entry.agendamentoId, {
          valor: entry.valorEntrada,
          percentual: entry.percentualEntrada,
          status: 'confirmado',
        })
      }
      await recarregar()
      addToast('Entrada marcada como recebida.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleCreate = () => {
    const today = new Date()
    openCreateDrawer(isSameMonth(month, today) ? today : month)
  }

  const entradas = resumo?.entradas ?? []

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Planejamento financeiro
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Previsão dos ensaios e valores recebidos no mês.
            </p>
          </div>

          <FinanceMonthNavigator month={month} onChange={setMonth} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {erro ? (
          <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{erro}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void recarregar().catch(() => undefined)}
            >
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {carregando && !resumo ? (
          <p className="py-10 text-center text-sm text-muted">Carregando financeiro…</p>
        ) : (
          <>
            {resumo ? <FinanceSummaryCards summary={resumo} /> : null}

            {entradas.length === 0 ? (
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
                  entries={entradas}
                  onOpen={(appointmentId) => openAppointmentDrawer(appointmentId)}
                  onConfirm={handleConfirm}
                />
                <p className="px-1 text-[11px] leading-relaxed text-muted">
                  O valor “a receber” inclui entradas pendentes, saldos finais e fotos
                  extras. Os valores são consolidados pelo backend.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
