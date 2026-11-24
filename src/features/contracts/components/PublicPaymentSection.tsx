import { useState } from 'react'
import { CheckCircle2, Paperclip, Upload, Wallet } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { UploadProgress } from '@/shared/components/ui/UploadProgress'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'
import { EntradaStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { PROOF_ACCEPT, validateProofFile } from '@/features/contracts/lib/proofFile'
import {
  publicCard,
  publicCtaClass,
} from '@/features/contracts/components/public/publicContractTheme'

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
  const canUpload = contrato.statusEntrada === 'pendente' && (!proof || Boolean(rejected))

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
    <section className={cn(publicCard, 'print-hidden p-4 sm:p-6')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-cyan-950">Pagamento da entrada</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Envie o comprovante para o estúdio confirmar o recebimento.
          </p>
        </div>
        <EntradaStatusBadge
          status={contrato.statusEntrada}
          pagamento={contrato.pagamento}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-cyan-50/70 p-3 text-xs">
        <div>
          <p className="text-slate-500">Entrada</p>
          <p className="font-semibold text-cyan-950">
            {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)
          </p>
        </div>
        <div>
          <p className="text-slate-500">Saldo restante</p>
          <p className="font-semibold text-cyan-950">{formatBRL(contrato.saldoRestante)}</p>
        </div>
      </div>

      {contrato.snapshot.estudio.chavePix ? (
        <p className="mt-2 text-xs text-slate-500">
          Pix:{' '}
          <span className="font-medium text-cyan-950">
            {contrato.snapshot.estudio.chavePix}
          </span>
        </p>
      ) : null}

      {contrato.snapshot.estudio.instrucoesPagamento ? (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {contrato.snapshot.estudio.instrucoesPagamento}
        </p>
      ) : null}

      {proof ? (
        <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-3">
          <p className="flex items-center gap-1.5 text-xs text-cyan-950">
            <Paperclip className="size-3.5" />
            {proof.nomeArquivo} · {Math.round(proof.tamanho / 1024)} KB
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {rejected
              ? 'Comprovante rejeitado. Envie um novo arquivo.'
              : 'Comprovante em análise pelo estúdio.'}
          </p>
          {rejected ? (
            <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
              {rejected.motivo}
            </p>
          ) : null}
        </div>
      ) : null}

      {canUpload ? (
        <div className="mt-3">
          <label
            htmlFor="public-payment-proof"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 px-3 py-5 text-center transition hover:border-cyan-400 hover:bg-cyan-50"
          >
            <Upload className="size-5 text-cyan-600" />
            <span className="mt-1 text-sm font-medium text-cyan-950">
              {proof ? 'Enviar novo comprovante' : 'Anexar comprovante'}
            </span>
            <span className="text-xs text-slate-500">Imagem ou PDF até 10 MB</span>
            <input
              id="public-payment-proof"
              type="file"
              accept={PROOF_ACCEPT}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          {file ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Paperclip className="size-3" />
              {file.name} · {Math.round(file.size / 1024)} KB
            </p>
          ) : null}

          {fileError ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
              {fileError}
            </p>
          ) : null}

          {progress ? <UploadProgress progress={progress} onCancel={onCancel} /> : null}

          {error ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!file || submitting}
            onClick={() => {
              if (!file) {
                setFileError('Selecione o comprovante.')
                return
              }
              onSubmit(file)
            }}
            className={cn(publicCtaClass, 'mt-3')}
          >
            <CheckCircle2 className="h-5 w-5" />
            {submitting ? 'Enviando…' : 'Enviar comprovante'}
          </button>
        </div>
      ) : null}

      {contrato.statusEntrada === 'confirmado' ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Entrada confirmada pelo estúdio.{' '}
          {contrato.statusSaldoFinal === 'confirmado'
            ? 'Saldo final já recebido.'
            : contrato.statusSaldoFinal === 'isento'
              ? 'Saldo final isento.'
              : `Saldo final de ${formatBRL(contrato.saldoRestante)} será recebido no dia do ensaio.`}
        </p>
      ) : null}

      {contrato.statusEntrada === 'isento' ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Wallet className="size-3.5" />
          Este ensaio não possui entrada a pagar.
        </p>
      ) : null}
    </section>
  )
}
