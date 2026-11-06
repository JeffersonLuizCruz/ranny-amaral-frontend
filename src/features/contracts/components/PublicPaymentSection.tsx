import { useState } from 'react'
import { CheckCircle2, Paperclip, Upload, Wallet } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { Button } from '@/shared/components/ui/Button'
import { UploadProgress } from '@/shared/components/ui/UploadProgress'
import { formatBRL } from '@/shared/lib/currency'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'
import { PagamentoStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { PROOF_ACCEPT, validateProofFile } from '@/features/contracts/lib/proofFile'

interface PublicPaymentSectionProps {
  contrato: Contrato
  submitting: boolean
  error?: string
  progress?: UploadProgressValue
  onCancel?: () => void
  onSubmit: (file: File) => void
}

export function PublicPaymentSection({
  contrato,
  submitting,
  error,
  progress,
  onCancel,
  onSubmit,
}: PublicPaymentSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  const proof = contrato.pagamento.comprovante
  const rejected = contrato.pagamento.rejeicao
  const canUpload = contrato.statusPagamento === 'pendente' && (!proof || Boolean(rejected))

  const handleFileChange = (nextFile: File | null) => {
    setFileError('')
    if (!nextFile) {
      setFile(null)
      return
    }
    const erro = validateProofFile(nextFile)
    if (erro) {
      setFileError(erro)
      setFile(null)
      return
    }
    setFile(nextFile)
  }

  return (
    <section className="print-hidden rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">Pagamento da entrada</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Envie o comprovante para o estúdio confirmar o recebimento.
          </p>
        </div>
        <PagamentoStatusBadge
          status={contrato.statusPagamento}
          pagamento={contrato.pagamento}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted">Entrada</p>
          <p className="font-semibold text-ink">
            {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)
          </p>
        </div>
        <div>
          <p className="text-muted">Saldo restante</p>
          <p className="font-semibold text-ink">{formatBRL(contrato.saldoRestante)}</p>
        </div>
      </div>

      {contrato.snapshot.estudio.chavePix ? (
        <p className="mt-2 text-[11px] text-muted">
          Pix: <span className="font-medium text-ink">{contrato.snapshot.estudio.chavePix}</span>
        </p>
      ) : null}

      {contrato.snapshot.estudio.instrucoesPagamento ? (
        <p className="mt-1 text-[10px] leading-relaxed text-muted">
          {contrato.snapshot.estudio.instrucoesPagamento}
        </p>
      ) : null}

      {proof ? (
        <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-ink">
            <Paperclip className="size-3.5" />
            {proof.nomeArquivo} · {Math.round(proof.tamanho / 1024)} KB
          </p>
          <p className="mt-1 text-[10px] text-muted">
            {rejected
              ? 'Comprovante rejeitado. Envie um novo arquivo.'
              : 'Comprovante em análise pelo estúdio.'}
          </p>
          {rejected ? (
            <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] text-red-700">
              {rejected.motivo}
            </p>
          ) : null}
        </div>
      ) : null}

      {canUpload ? (
        <div className="mt-3">
          <label
            htmlFor="public-payment-proof"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas/60 px-3 py-4 text-center transition hover:border-brand-300 hover:bg-brand-50/30"
          >
            <Upload className="size-5 text-muted" />
            <span className="mt-1 text-[11px] font-medium text-ink">
              {proof ? 'Enviar novo comprovante' : 'Anexar comprovante'}
            </span>
            <span className="text-[10px] text-muted">Imagem ou PDF até 10 MB</span>
            <input
              id="public-payment-proof"
              type="file"
              accept={PROOF_ACCEPT}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          {file ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
              <Paperclip className="size-3" />
              {file.name} · {Math.round(file.size / 1024)} KB
            </p>
          ) : null}

          {fileError ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {fileError}
            </p>
          ) : null}

          {progress ? <UploadProgress progress={progress} onCancel={onCancel} /> : null}

          {error ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            className="mt-2"
            fullWidth
            disabled={!file || submitting}
            onClick={() => {
              if (!file) {
                setFileError('Selecione o comprovante.')
                return
              }
              onSubmit(file)
            }}
          >
            <CheckCircle2 className="size-4" />
            {submitting ? 'Enviando…' : 'Enviar comprovante'}
          </Button>
        </div>
      ) : null}

      {contrato.statusPagamento === 'confirmado' ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-700">
          Pagamento confirmado pelo estúdio.
        </p>
      ) : null}

      {contrato.statusPagamento === 'isento' ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
          <Wallet className="size-3.5" />
          Este ensaio não possui entrada a pagar.
        </p>
      ) : null}
    </section>
  )
}
