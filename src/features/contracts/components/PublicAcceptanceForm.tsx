import { useEffect, useRef, useState } from 'react'
import type { ComponentType, FormEvent, ReactNode } from 'react'
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Paperclip,
  Receipt,
  Upload,
  User,
  Wallet,
} from 'lucide-react'

import type { Contrato, DadosAceiteInput } from '@/domain/contracts'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import {
  createEmptyAcceptanceValues,
  validateAcceptanceForm,
  type AcceptanceFormErrors,
  type AcceptanceFormValues,
} from '@/features/contracts/lib/documentValidation'
import { PROOF_ACCEPT, validateProofFile } from '@/features/contracts/lib/proofFile'
import {
  publicCard,
  publicCtaClass,
  publicDisplay,
  publicInputClass,
  publicLabelClass,
  publicSelectClass,
} from '@/features/contracts/components/public/publicContractTheme'

interface PublicAcceptanceFormProps {
  contrato: Contrato
  submitting: boolean
  error?: string
  onSubmit: (input: DadosAceiteInput, comprovante?: File) => void
}

interface PublicFieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

function PublicField({ label, htmlFor, error, children }: PublicFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={publicLabelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface FormSectionProps {
  step: number
  title: string
  description?: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

function FormSection({ step, title, description, icon: Icon, children }: FormSectionProps) {
  return (
    <section className={cn(publicCard, 'p-5 sm:p-7')}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className={`${publicDisplay} text-lg font-semibold text-cyan-950`}>
            {step}. {title}
          </h2>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
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
  const errorRef = useRef<HTMLDivElement>(null)

  const requiresProof =
    contrato.valorEntrada > 0 &&
    contrato.statusEntrada === 'pendente' &&
    (!contrato.pagamento.comprovante || Boolean(contrato.pagamento.rejeicao))
  const comprovanteEmAnalise =
    contrato.statusEntrada === 'pendente' &&
    Boolean(contrato.pagamento.comprovante) &&
    !contrato.pagamento.rejeicao

  useEffect(() => {
    if (!error) return
    errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    errorRef.current?.focus()
  }, [error])

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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormSection
        step={1}
        title="Seus dados"
        description="Preencha como consta nos seus documentos."
        icon={User}
      >
        <PublicField
          label="Nome completo *"
          htmlFor="acceptance-name"
          error={errors.nomeCompleto}
        >
          <input
            id="acceptance-name"
            data-autofocus
            value={values.nomeCompleto}
            onChange={(event) => update({ nomeCompleto: event.target.value })}
            className={publicInputClass}
            placeholder="Como consta no RG"
            autoComplete="name"
            aria-invalid={Boolean(errors.nomeCompleto)}
          />
        </PublicField>

        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
          <PublicField label="Documento" htmlFor="acceptance-document-type">
            <select
              id="acceptance-document-type"
              value={values.tipoDocumento}
              onChange={(event) =>
                update({ tipoDocumento: event.target.value as 'rg' | 'cpf' })
              }
              className={publicSelectClass}
            >
              <option value="cpf">CPF</option>
              <option value="rg">RG</option>
            </select>
          </PublicField>

          <PublicField label="Número *" htmlFor="acceptance-document" error={errors.documento}>
            <input
              id="acceptance-document"
              value={values.documento}
              onChange={(event) => update({ documento: event.target.value })}
              placeholder={values.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000-0'}
              inputMode={values.tipoDocumento === 'cpf' ? 'numeric' : 'text'}
              className={publicInputClass}
              aria-invalid={Boolean(errors.documento)}
            />
          </PublicField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PublicField label="Cidade *" htmlFor="acceptance-city" error={errors.cidade}>
            <input
              id="acceptance-city"
              value={values.cidade}
              onChange={(event) => update({ cidade: event.target.value })}
              placeholder="Sua cidade"
              className={publicInputClass}
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.cidade)}
            />
          </PublicField>

          <PublicField
            label="WhatsApp (opcional)"
            htmlFor="acceptance-whatsapp"
            error={errors.whatsapp}
          >
            <input
              id="acceptance-whatsapp"
              value={values.whatsapp}
              onChange={(event) => update({ whatsapp: event.target.value })}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className={publicInputClass}
              autoComplete="tel"
              aria-invalid={Boolean(errors.whatsapp)}
            />
          </PublicField>
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Uso de imagem"
        description="Escolha se autoriza o uso profissional das suas fotos."
        icon={Camera}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-cyan-100 px-4 py-3 transition-colors has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-50">
            <input
              type="radio"
              name="autoriza-uso-imagem"
              checked={values.autorizaUsoImagem === true}
              onChange={() => update({ autorizaUsoImagem: true })}
              className="h-5 w-5 shrink-0 accent-cyan-600"
            />
            <Camera className="h-5 w-5 text-cyan-600" />
            <span className="font-medium text-slate-700">AUTORIZO</span>
          </label>
          <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-cyan-100 px-4 py-3 transition-colors has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-50">
            <input
              type="radio"
              name="autoriza-uso-imagem"
              checked={values.autorizaUsoImagem === false}
              onChange={() => update({ autorizaUsoImagem: false })}
              className="h-5 w-5 shrink-0 accent-cyan-600"
            />
            <CameraOff className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-700">NÃO AUTORIZO</span>
          </label>
        </div>
        <p className="text-sm leading-relaxed text-slate-500">
          Ao autorizar, as imagens poderão ser utilizadas para fins profissionais e
          promocionais do estúdio (redes sociais, portfólio, website e materiais
          publicitários).
        </p>
      </FormSection>

      <FormSection
        step={3}
        title="Entrada e comprovante"
        description="Confira os valores e anexe o comprovante quando necessário."
        icon={Wallet}
      >
        <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Valor da entrada</p>
              <p className="font-semibold text-cyan-950">
                {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo restante</p>
              <p className="font-semibold text-cyan-950">{formatBRL(contrato.saldoRestante)}</p>
            </div>
          </div>

          {contrato.snapshot.estudio.chavePix ? (
            <p className="mt-3 text-sm text-slate-600">
              Pix:{' '}
              <span className="font-semibold text-cyan-950">
                {contrato.snapshot.estudio.chavePix}
              </span>
            </p>
          ) : null}

          {contrato.snapshot.estudio.instrucoesPagamento ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {contrato.snapshot.estudio.instrucoesPagamento}
            </p>
          ) : null}
        </div>

        {requiresProof ? (
          <div>
            <label
              htmlFor="acceptance-proof"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 px-3 py-5 text-center transition hover:border-cyan-400 hover:bg-cyan-50"
            >
              <Upload className="size-5 text-cyan-600" />
              <span className="mt-1 text-sm font-medium text-cyan-950">
                Anexar comprovante de pagamento
              </span>
              <span className="text-xs text-slate-500">Imagem ou PDF até 10 MB</span>
              <input
                id="acceptance-proof"
                type="file"
                accept={PROOF_ACCEPT}
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            {proof ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Paperclip className="size-3" />
                {proof.name} · {Math.round(proof.size / 1024)} KB
              </p>
            ) : null}

            {errors.comprovante ? (
              <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.comprovante}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
            <Receipt className="mt-0.5 size-4 shrink-0" />
            <p>
              {comprovanteEmAnalise
                ? 'Comprovante em análise pelo estúdio.'
                : contrato.statusEntrada === 'confirmado'
                  ? 'Entrada já confirmada pelo estúdio.'
                  : contrato.statusEntrada === 'isento'
                    ? 'Este ensaio não possui entrada a pagar.'
                    : 'Entrada já recebida pelo estúdio.'}
            </p>
          </div>
        )}
      </FormSection>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-cyan-100">
        <input
          type="checkbox"
          checked={values.aceite}
          onChange={(event) => update({ aceite: event.target.checked })}
          className="mt-0.5 size-4 shrink-0 rounded border-cyan-200 accent-cyan-600"
          aria-invalid={Boolean(errors.aceite)}
        />
        <span className="text-sm leading-relaxed text-slate-700">
          Li e aceito os termos do contrato {contrato.numero}. Confirmo que os dados
          acima são verdadeiros.
        </span>
      </label>

      {errors.aceite ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {errors.aceite}
        </p>
      ) : null}

      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 bg-gradient-to-t from-cyan-50 via-cyan-50/95 to-transparent px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:-mx-6 sm:px-6">
        <button type="submit" disabled={submitting} className={publicCtaClass}>
          <CheckCircle2 className="h-5 w-5" />
          {submitting ? 'Registrando aceite…' : 'Aceitar contrato'}
        </button>
      </div>

      <p className="pb-2 text-center text-xs leading-relaxed text-cyan-900/60">
        Este é um aceite eletrônico com registro de nome, documento, cidade, data e hash
        do conteúdo.
      </p>
    </form>
  )
}
