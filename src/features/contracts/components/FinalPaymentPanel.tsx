import { useState } from 'react'
import { Banknote, CheckCircle2, Clock3, Wallet } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import type { FormaPagamentoSaldo } from '@/domain/payments'
import type { AgendamentoEnsaio } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { FinalPaymentDialog } from '@/features/contracts/components/FinalPaymentDialog'

interface FinalPaymentPanelProps {
  appointment?: AgendamentoEnsaio
  contrato?: Contrato
  compact?: boolean
}

const FORMA_LABEL: Record<FormaPagamentoSaldo, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro em mãos',
  outro: 'Outro',
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function FinalPaymentPanel({
  appointment,
  contrato,
  compact = false,
}: FinalPaymentPanelProps) {
  const [open, setOpen] = useState(false)
  const marcarPagamentoFinalIsento = useContractStore(
    (state) => state.marcarPagamentoFinalIsento,
  )
  const addToast = useToastStore((state) => state.addToast)

  const saldo = contrato?.saldoRestante ?? appointment?.saldoRestante ?? 0
  const pagamentoFinal = contrato?.pagamentoFinal ?? appointment?.pagamentoFinal
  const status = contrato?.statusPagamentoFinal ?? pagamentoFinal?.status ?? 'pendente'
  const confirmado = status === 'confirmado'
  const isento = status === 'isento'
  const liquidado = confirmado || isento

  const handleExempt = async () => {
    if (!contrato) return
    const ok = window.confirm('Marcar o saldo final como isento?')
    if (!ok) return

    try {
      await marcarPagamentoFinalIsento(contrato.id)
      addToast('Saldo final marcado como isento.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <div className={compact ? '' : 'rounded-xl border border-line p-3'}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {confirmado ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : isento ? (
            <Banknote className="size-4 text-slate-500" />
          ) : (
            <Clock3 className="size-4 text-amber-600" />
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Saldo final
          </p>
        </div>
        <span
          className={
            confirmado
              ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200'
              : isento
                ? 'rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200'
                : 'rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200'
          }
        >
          {confirmado ? 'Recebido' : isento ? 'Isento' : 'Pendente'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{formatBRL(saldo)}</p>
          {confirmado ? (
            <p className="mt-0.5 text-[10px] text-muted">
              {pagamentoFinal?.formaPagamento
                ? FORMA_LABEL[pagamentoFinal.formaPagamento]
                : 'Forma não informada'}{' '}
              · {formatDateTime(pagamentoFinal?.recebidoEm)}
            </p>
          ) : isento ? (
            <p className="mt-0.5 text-[10px] text-muted">Sem saldo a receber.</p>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted">
              Receba via Pix ou dinheiro e registre no sistema.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {contrato ? (
            <Button
              size="sm"
              variant={liquidado ? 'secondary' : 'primary'}
              onClick={() => setOpen(true)}
            >
              <Wallet className="size-3.5" />
              {confirmado ? 'Corrigir' : 'Registrar saldo'}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              <Wallet className="size-3.5" />
              Registrar saldo
            </Button>
          )}
          {!liquidado && contrato ? (
            <Button size="sm" variant="ghost" onClick={handleExempt}>
              Isentar
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <FinalPaymentDialog
          key={`${contrato?.id ?? appointment?.id}-${saldo}`}
          open={open}
          appointment={appointment}
          contrato={contrato}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}
