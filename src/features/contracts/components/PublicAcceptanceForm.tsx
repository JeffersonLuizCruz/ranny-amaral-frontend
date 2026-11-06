import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Paperclip, Upload, Wallet } from 'lucide-react'

import type { Contrato, DadosAceiteInput } from '@/domain/contracts'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, selectClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import {
  createEmptyAcceptanceValues,
  validateAcceptanceForm,
  type AcceptanceFormErrors,
  type AcceptanceFormValues,
} from '@/features/contracts/lib/documentValidation'
import { PROOF_ACCEPT, validateProofFile } from '@/features/contracts/lib/proofFile'

interface PublicAcceptanceFormProps {
  contrato: Contrato
  submitting: boolean
  error?: string
  onSubmit: (input: DadosAceiteInput, comprovante?: File) => void
}

export function PublicAcceptanceForm({
  contrato,
  submitting,
  error,
  onSubmit,
}: PublicAcceptanceFormProps) {
  const [values, setValues] = useState<AcceptanceFormValues>(() =>
    createEmptyAcceptanceValues(
      contrato.snapshot.cliente.nome === 'A preencher'
        ? ''
        : contrato.snapshot.cliente.nome,
      contrato.snapshot.cliente.whatsapp ?? '',
    ),
  )
  const [errors, setErrors] = useState<AcceptanceFormErrors>({})
  const [proof, setProof] = useState<File | null>(null)

  const requiresProof =
    contrato.valorEntrada > 0 &&
    contrato.statusPagamento === 'pendente' &&
    (!contrato.pagamento.comprovante || Boolean(contrato.pagamento.rejeicao))

  const update = (patch: Partial<AcceptanceFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  const handleFileChange = (file: File | null) => {
    setErrors((current) => ({ ...current, comprovante: undefined }))

    if (!file) {
      setProof(null)
      return
    }

    const erro = validateProofFile(file)
    if (erro) {
      setErrors((current) => ({
        ...current,
        comprovante: erro,
      }))
      setProof(null)
      return
    }

    setProof(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateAcceptanceForm(values)

    if (!result.draft) {
      setErrors(result.errors)
      return
    }

    if (requiresProof && !proof) {
      setErrors((current) => ({
        ...current,
        comprovante: 'Anexe o comprovante de pagamento da entrada.',
      }))
      return
    }

    onSubmit(result.draft, proof ?? undefined)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-4 shadow-card"
      noValidate
    >
      <h2 className="text-sm font-semibold text-ink">Aceite do contrato</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Confira seus dados, pague a entrada e anexe o comprovante para concluir.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Nome completo" htmlFor="acceptance-name" error={errors.nomeCompleto}>
          <input
            id="acceptance-name"
            data-autofocus
            value={values.nomeCompleto}
            onChange={(event) => update({ nomeCompleto: event.target.value })}
            className={inputClass}
            autoComplete="name"
            aria-invalid={Boolean(errors.nomeCompleto)}
          />
        </Field>

        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
          <Field label="Documento" htmlFor="acceptance-document-type">
            <select
              id="acceptance-document-type"
              value={values.tipoDocumento}
              onChange={(event) =>
                update({ tipoDocumento: event.target.value as 'rg' | 'cpf' })
              }
              className={selectClass}
            >
              <option value="cpf">CPF</option>
              <option value="rg">RG</option>
            </select>
          </Field>

          <Field label="Número" htmlFor="acceptance-document" error={errors.documento}>
            <input
              id="acceptance-document"
              value={values.documento}
              onChange={(event) => update({ documento: event.target.value })}
              placeholder={values.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000-0'}
              inputMode={values.tipoDocumento === 'cpf' ? 'numeric' : 'text'}
              className={inputClass}
              aria-invalid={Boolean(errors.documento)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cidade" htmlFor="acceptance-city" error={errors.cidade}>
            <input
              id="acceptance-city"
              value={values.cidade}
              onChange={(event) => update({ cidade: event.target.value })}
              placeholder="Cidade"
              className={inputClass}
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.cidade)}
            />
          </Field>

          <Field label="WhatsApp (opcional)" htmlFor="acceptance-whatsapp" error={errors.whatsapp}>
            <input
              id="acceptance-whatsapp"
              value={values.whatsapp}
              onChange={(event) => update({ whatsapp: event.target.value })}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className={inputClass}
              aria-invalid={Boolean(errors.whatsapp)}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted" />
            <p className="text-xs font-semibold text-ink">Entrada do ensaio</p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-muted">Valor da entrada</p>
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

          {requiresProof ? (
            <div className="mt-3">
              <label
                htmlFor="acceptance-proof"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-3 py-4 text-center transition hover:border-brand-300 hover:bg-brand-50/30"
              >
                <Upload className="size-5 text-muted" />
                <span className="mt-1 text-[11px] font-medium text-ink">
                  Anexar comprovante de pagamento
                </span>
                <span className="text-[10px] text-muted">Imagem ou PDF até 10 MB</span>
                <input
                  id="acceptance-proof"
                  type="file"
                  accept={PROOF_ACCEPT}
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>

              {proof ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
                  <Paperclip className="size-3" />
                  {proof.name} · {Math.round(proof.size / 1024)} KB
                </p>
              ) : null}

              {errors.comprovante ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.comprovante}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] text-emerald-700">
              {contrato.statusPagamento === 'confirmado'
                ? 'Entrada já confirmada pelo estúdio.'
                : 'Este ensaio não possui entrada a pagar.'}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-canvas/60 p-3">
          <input
            type="checkbox"
            checked={values.aceite}
            onChange={(event) => update({ aceite: event.target.checked })}
            className="mt-0.5 size-4 rounded border-line accent-brand-600"
          />
          <span className="text-[11px] leading-relaxed text-ink">
            Li e aceito os termos do contrato {contrato.numero}. Confirmo que os dados
            acima são verdadeiros.
          </span>
        </label>

        {errors.aceite ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {errors.aceite}
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={submitting}>
          <CheckCircle2 className="size-4" />
          {submitting ? 'Registrando aceite…' : 'Aceitar contrato'}
        </Button>

        <p className={cn('text-center text-[10px] leading-relaxed text-muted')}>
          Este é um aceite eletrônico com registro de nome, documento, cidade, data e
          hash do conteúdo.
        </p>
      </div>
    </form>
  )
}
