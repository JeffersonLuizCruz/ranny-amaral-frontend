import {
  CheckCircle2,
  Eye,
  FileCheck2,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { paymentProofStorage } from '@/integrations/paymentProof'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { useToastStore } from '@/shared/store/toastStore'
import { PagamentoStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { useContractStore } from '@/features/contracts/store/contractStore'

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ContractPaymentPanel({ contrato }: { contrato: Contrato }) {
  const confirmPayment = useContractStore((state) => state.confirmPayment)
  const rejectProof = useContractStore((state) => state.rejectProof)
  const markPaymentExempt = useContractStore((state) => state.markPaymentExempt)
  const addToast = useToastStore((state) => state.addToast)

  const pagamento = contrato.pagamento
  const isSettled = ['confirmado', 'isento'].includes(contrato.statusPagamento)
  const canConfirm = contrato.statusPagamento === 'pendente'
  const hasProof = Boolean(pagamento.comprovante)

  const handleConfirm = () => {
    confirmPayment(contrato.id)
    addToast('Pagamento confirmado. Ensaio atualizado.')
  }

  const handleReject = () => {
    const motivo = window.prompt(
      'Motivo da rejeição do comprovante:',
      'Comprovante ilegível ou valor divergente.',
    )
    if (!motivo) return

    rejectProof(contrato.id, motivo)
    addToast('Comprovante rejeitado. O cliente pode reenviar.')
  }

  const handleExempt = () => {
    const confirmed = window.confirm('Marcar a entrada como isenta?')
    if (!confirmed) return
    markPaymentExempt(contrato.id)
    addToast('Entrada marcada como isenta.')
  }

  const handleViewProof = async () => {
    if (!pagamento.comprovante) return

    try {
      const blob = await paymentProofStorage.get(pagamento.comprovante.arquivoKey)
      if (!blob) {
        addToast('Comprovante não encontrado neste navegador.')
        return
      }

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      addToast('Não foi possível abrir o comprovante.')
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Pagamento da entrada</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            Acompanhe o comprovante e confirme o recebimento.
          </p>
        </div>
        <PagamentoStatusBadge
          status={contrato.statusPagamento}
          pagamento={pagamento}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-muted">Entrada</dt>
          <dd className="font-semibold text-ink">
            {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)
          </dd>
        </div>
        <div>
          <dt className="text-muted">Saldo restante</dt>
          <dd className="font-semibold text-ink">{formatBRL(contrato.saldoRestante)}</dd>
        </div>
        <div>
          <dt className="text-muted">Forma</dt>
          <dd className="font-medium text-ink">{contrato.formaPagamento}</dd>
        </div>
        <div>
          <dt className="text-muted">Confirmado em</dt>
          <dd className="font-medium text-ink">
            {formatDateTime(pagamento.confirmadoEm)}
          </dd>
        </div>
      </dl>

      {pagamento.comprovante ? (
        <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">
                {pagamento.comprovante.nomeArquivo}
              </p>
              <p className="text-[10px] text-muted">
                {Math.round(pagamento.comprovante.tamanho / 1024)} KB ·{' '}
                {formatDateTime(pagamento.comprovante.enviadoEm)}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleViewProof}>
              <Eye className="size-3.5" />
              Ver
            </Button>
          </div>

          {pagamento.rejeicao ? (
            <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-[10px] text-red-700">
              Rejeitado em {formatDateTime(pagamento.rejeicao.rejeitadoEm)}: {pagamento.rejeicao.motivo}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas/60 p-3 text-[11px] text-muted">
          {isSettled
            ? 'Pagamento concluído ou isento.'
            : 'Aguardando o cliente enviar o comprovante de pagamento.'}
        </p>
      )}

      {!isSettled && contrato.statusAceite !== 'cancelado' ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {canConfirm ? (
            <Button size="sm" onClick={handleConfirm}>
              <CheckCircle2 className="size-3.5" />
              Confirmar pagamento
            </Button>
          ) : null}
          {hasProof ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleReject}
            >
              <XCircle className="size-3.5" />
              Rejeitar comprovante
            </Button>
          ) : null}
          {contrato.valorEntrada > 0 && canConfirm ? (
            <Button size="sm" variant="ghost" onClick={handleExempt}>
              <ShieldCheck className="size-3.5" />
              Marcar isento
            </Button>
          ) : null}
        </div>
      ) : null}

      {paymentProofStorage.mode === 'local' ? (
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
          <Wallet className="size-3" />
          Comprovante armazenado localmente neste navegador.
        </p>
      ) : null}
    </section>
  )
}
