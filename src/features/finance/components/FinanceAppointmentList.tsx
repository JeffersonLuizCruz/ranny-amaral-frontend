import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, ChevronRight, Wallet } from 'lucide-react'

import type { Cliente, PacoteFotografico } from '@/domain/types'
import { StatusBadge } from '@/features/appointments/components/StatusBadge'
import { PagamentoStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import type { FinanceEntry } from '@/features/finance/lib/summary'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { formatTimeRange } from '@/shared/lib/date'

interface FinanceAppointmentListProps {
  entries: FinanceEntry[]
  clientesById: Map<string, Cliente>
  pacotesById: Map<string, PacoteFotografico>
  onOpen: (appointmentId: string) => void
  onConfirm: (entry: FinanceEntry) => void
}

export function FinanceAppointmentList({
  entries,
  clientesById,
  pacotesById,
  onOpen,
  onConfirm,
}: FinanceAppointmentListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Ensaios do mês</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            {entries.length} {entries.length === 1 ? 'ensaio' : 'ensaios'} · toque para abrir
          </p>
        </div>
        <CalendarDays className="size-4 shrink-0 text-muted" />
      </div>

      <div>
        {entries.map((entry) => {
          const { appointment } = entry
          const start = new Date(appointment.dataHoraInicio)
          const cliente = appointment.clienteId
            ? clientesById.get(appointment.clienteId)
            : undefined
          const nome = cliente?.nome ?? appointment.contato?.nome ?? 'Sem cliente'
          const pacote = pacotesById.get(appointment.pacoteId)
          const canConfirm = entry.entradaSituacao === 'pendente'

          return (
            <div
              key={appointment.id}
              className="flex items-center gap-2 border-t border-line px-4 py-3 first:border-t-0"
            >
              <button
                type="button"
                onClick={() => onOpen(appointment.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-canvas/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas ring-1 ring-line">
                  <span className="text-base font-semibold leading-none text-ink">
                    {format(start, 'dd')}
                  </span>
                  <span className="mt-0.5 text-[9px] font-medium uppercase leading-none text-muted">
                    {format(start, 'MMM', { locale: ptBR }).replace('.', '')}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-ink">
                      {nome}
                    </span>
                    <StatusBadge status={appointment.status} />
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">
                    {pacote?.nome ?? 'Pacote'} ·{' '}
                    {formatTimeRange(
                      appointment.dataHoraInicio,
                      appointment.dataHoraFim,
                    )}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted sm:hidden">
                    <span className="font-semibold text-ink">
                      {formatBRL(entry.valorTotal)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <PagamentoStatusBadge
                      status={entry.entradaStatus}
                      pagamento={entry.pagamento}
                    />
                  </span>
                </span>

                <span className="hidden shrink-0 text-right sm:block">
                  <span className="block text-sm font-semibold text-ink">
                    {formatBRL(entry.valorTotal)}
                  </span>
                  <span className="mt-1 flex justify-end">
                    <PagamentoStatusBadge
                      status={entry.entradaStatus}
                      pagamento={entry.pagamento}
                    />
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    Saldo {formatBRL(entry.saldoRestante)} ·{' '}
                    {entry.statusFinal === 'confirmado'
                      ? 'recebido'
                      : entry.statusFinal === 'isento'
                        ? 'isento'
                        : 'pendente'}
                  </span>
                  {entry.valorExtras > 0 ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-amber-700">
                      Extras {formatBRL(entry.valorExtras)} ·{' '}
                      {entry.statusExtras === 'confirmado'
                        ? 'pago'
                        : entry.statusExtras === 'isento'
                          ? 'isento'
                          : 'pendente'}
                    </span>
                  ) : null}
                </span>

                <ChevronRight className="hidden size-4 shrink-0 text-muted sm:block" />
              </button>

              {canConfirm ? (
                <Button
                  size="sm"
                  variant="tonal"
                  className="shrink-0"
                  aria-label={`Marcar entrada de ${nome} como recebida`}
                  onClick={() => onConfirm(entry)}
                >
                  <Wallet className="size-3.5" />
                  <span className="hidden sm:inline">Receber</span>
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
