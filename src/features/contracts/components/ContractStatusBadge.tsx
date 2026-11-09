import {
  ACEITE_STATUS_META,
  type ContratoAceiteStatus,
  type ContratoPagamentoStatus,
} from '@/domain/contracts'
import type { PagamentoEntrada } from '@/domain/payments'
import { ENTRADA_STATUS_META, SALDO_FINAL_STATUS_META } from '@/domain/payments'
import { cn } from '@/shared/lib/cn'

export function AceiteStatusBadge({
  status,
  className,
}: {
  status: ContratoAceiteStatus
  className?: string
}) {
  const meta = ACEITE_STATUS_META[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function EntradaStatusBadge({
  status,
  pagamento,
  className,
}: {
  status: ContratoPagamentoStatus
  pagamento?: PagamentoEntrada
  className?: string
}) {
  const base = ENTRADA_STATUS_META[status]
  const emAnalise = status === 'pendente' && Boolean(pagamento?.comprovante)
  const rejeitado = status === 'pendente' && Boolean(pagamento?.rejeicao)

  const label = rejeitado
    ? 'Comprovante rejeitado'
    : emAnalise
      ? 'Comprovante em análise'
      : base.label

  const badge = rejeitado
    ? 'bg-red-50 text-red-700 ring-red-200'
    : emAnalise
      ? 'bg-blue-50 text-blue-700 ring-blue-200'
      : base.badge

  const dot = rejeitado
    ? 'bg-red-500'
    : emAnalise
      ? 'bg-blue-500'
      : base.dot

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

export function SaldoFinalStatusBadge({
  status,
  className,
}: {
  status: ContratoPagamentoStatus
  className?: string
}) {
  const base = SALDO_FINAL_STATUS_META[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        base.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', base.dot)} />
      {base.label}
    </span>
  )
}

export function ContractStatusBadges({
  aceite,
  entradaStatus,
  pagamento,
  saldoStatus,
}: {
  aceite: ContratoAceiteStatus
  entradaStatus: ContratoPagamentoStatus
  pagamento?: PagamentoEntrada
  saldoStatus?: ContratoPagamentoStatus
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AceiteStatusBadge status={aceite} />
      <EntradaStatusBadge status={entradaStatus} pagamento={pagamento} />
      {saldoStatus ? <SaldoFinalStatusBadge status={saldoStatus} /> : null}
    </div>
  )
}
