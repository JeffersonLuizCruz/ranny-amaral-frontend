import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays,
  Check,
  Clock,
  Images,
  MapPin,
  MessageCircle,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { LOCAL_PRESETS } from '@/domain/constants'
import {
  calcularPercentualEntrada,
  calcularSaldoRestante,
  calcularValorEntrada,
} from '@/domain/payments'
import type {
  AgendamentoDraft,
  AgendamentoEnsaio,
  PacoteFotografico,
} from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, textareaClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { formatBRL, parseCurrencyInput } from '@/shared/lib/currency'
import { menorValorFotoExtra } from '@/features/galleries/lib/selection'
import {
  combineDateAndTime,
  formatDuration,
  formatTimeValue,
  fromDateKey,
} from '@/shared/lib/date'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { ClientPicker } from '@/features/clients/components/ClientPicker'
import { PackagePicker } from '@/features/packages/components/PackagePicker'
import { usePackageStore } from '@/features/packages/store/packageStore'
import {
  buildCondicoesPacote,
  promocaoVigente,
  valorEfetivoPacote,
} from '@/features/packages/lib/pricing'
import {
  appointmentToFormValues,
  createEmptyAppointmentValues,
  validateAppointmentForm,
  type AppointmentFormErrors,
  type AppointmentFormValues,
} from '@/features/appointments/lib/validation'

interface AppointmentFormProps {
  appointment?: AgendamentoEnsaio
  defaultDate: string
  defaultStartTime: string
  defaultClienteId?: string | null
  onSubmit: (draft: AgendamentoDraft) => void
  onCancel: () => void
}

export function AppointmentForm({
  appointment,
  defaultDate,
  defaultStartTime,
  defaultClienteId,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const percentualPadrao = useStudioStore((state) => state.estudio.percentualEntradaPadrao)
  const pacotes = usePackageStore((state) => state.pacotes)
  const [values, setValues] = useState<AppointmentFormValues>(() =>
    appointment
      ? appointmentToFormValues(appointment)
      : createEmptyAppointmentValues(
          defaultDate,
          defaultStartTime,
          defaultClienteId,
          percentualPadrao,
        ),
  )
  const [errors, setErrors] = useState<AppointmentFormErrors>({})
  const [entradaValorTouched, setEntradaValorTouched] = useState(Boolean(appointment))

  const duration = Number(values.duracaoMinutos)
  const valorTotal = parseCurrencyInput(values.valorAcordado)
  const valorEntrada = parseCurrencyInput(values.valorEntrada)
  const saldoRestante = calcularSaldoRestante(valorTotal, valorEntrada)
  const pacoteSelecionado = pacotes.find((pacote) => pacote.id === values.pacoteId)
  const temPromocaoDisponivel = pacoteSelecionado
    ? promocaoVigente(pacoteSelecionado)
    : false

  const previewEnd = useMemo(() => {
    if (!values.data || !values.horaInicio) return null
    if (!Number.isFinite(duration) || duration <= 0) return null

    const date = fromDateKey(values.data)
    if (Number.isNaN(date.getTime())) return null

    const start = combineDateAndTime(values.data, values.horaInicio)
    return new Date(start.getTime() + duration * 60_000)
  }, [duration, values.data, values.horaInicio])

  const update = (patch: Partial<AppointmentFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  const handlePackageSelect = (pacote: PacoteFotografico) => {
    const percentual = values.percentualEntrada.trim()
      ? parseCurrencyInput(values.percentualEntrada)
      : percentualPadrao
    const aplicarPromocao = promocaoVigente(pacote)
    const total = valorEfetivoPacote(pacote, aplicarPromocao)
    const entrada = calcularValorEntrada(total, percentual)

    setValues((current) => ({
      ...current,
      pacoteId: pacote.id,
      duracaoMinutos: String(pacote.duracaoMinutos),
      valorAcordado: String(total),
      percentualEntrada: String(percentual),
      valorEntrada: String(entrada),
      promocaoAplicada: aplicarPromocao,
    }))
    setEntradaValorTouched(false)
    setErrors({})
  }

  const handlePromocaoToggle = (aplicar: boolean) => {
    if (!pacoteSelecionado) return

    const total = valorEfetivoPacote(pacoteSelecionado, aplicar)
    const percentual = values.percentualEntrada.trim()
      ? parseCurrencyInput(values.percentualEntrada)
      : percentualPadrao
    const entrada = entradaValorTouched
      ? parseCurrencyInput(values.valorEntrada)
      : calcularValorEntrada(total, percentual)

    setValues((current) => ({
      ...current,
      promocaoAplicada: aplicar,
      valorAcordado: String(total),
      percentualEntrada: entradaValorTouched
        ? String(calcularPercentualEntrada(total, entrada))
        : String(percentual),
      valorEntrada: String(entrada),
    }))
    setErrors({})
  }

  const handleTotalChange = (value: string) => {
    const total = parseCurrencyInput(value)

    setValues((current) => {
      if (entradaValorTouched) {
        const entrada = parseCurrencyInput(current.valorEntrada)
        return {
          ...current,
          valorAcordado: value,
          promocaoAplicada: false,
          percentualEntrada: String(calcularPercentualEntrada(total, entrada)),
        }
      }

      const percentual = current.percentualEntrada.trim()
        ? parseCurrencyInput(current.percentualEntrada)
        : percentualPadrao
      return {
        ...current,
        valorAcordado: value,
        promocaoAplicada: false,
        valorEntrada: String(calcularValorEntrada(total, percentual)),
      }
    })
    setErrors({})
  }

  const handlePercentualChange = (value: string) => {
    const total = parseCurrencyInput(values.valorAcordado)
    const percentual = parseCurrencyInput(value)

    setValoresEntrada(value, String(calcularValorEntrada(total, percentual)))
    setEntradaValorTouched(false)
  }

  const handleEntradaValueChange = (value: string) => {
    const total = parseCurrencyInput(values.valorAcordado)
    const entrada = parseCurrencyInput(value)

    setValoresEntrada(String(calcularPercentualEntrada(total, entrada)), value)
    setEntradaValorTouched(true)
  }

  const setValoresEntrada = (percentual: string, entrada: string) => {
    setValues((current) => ({
      ...current,
      percentualEntrada: percentual,
      valorEntrada: entrada,
    }))
    setErrors({})
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateAppointmentForm(values)

    if (!result.draft) {
      setErrors(result.errors)
      return
    }

    onSubmit({
      ...result.draft,
      condicoesPacote: pacoteSelecionado
        ? buildCondicoesPacote(pacoteSelecionado, values.promocaoAplicada)
        : appointment?.condicoesPacote,
      pagamentoFinal: appointment?.pagamentoFinal,
      financeiro: appointment?.financeiro,
      galeriaId: appointment?.galeriaId,
      galeria: appointment?.galeria,
      lembretes: appointment?.lembretes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Cliente existente (opcional)">
        <ClientPicker
          value={values.clienteId}
          onChange={(clienteId) => update({ clienteId })}
        />
        <p className="mt-1 text-[11px] text-muted">
          Se não houver cliente, o contrato criará o cadastro no aceite.
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contato da reserva" htmlFor="appointment-contact-name" error={errors.contatoNome}>
          <input
            id="appointment-contact-name"
            value={values.contatoNome}
            onChange={(event) => update({ contatoNome: event.target.value })}
            placeholder="Nome de quem reservou"
            className={inputClass}
            aria-invalid={Boolean(errors.contatoNome)}
          />
        </Field>
        <Field
          label="WhatsApp do contato"
          htmlFor="appointment-contact-whatsapp"
          error={errors.contatoWhatsapp}
        >
          <input
            id="appointment-contact-whatsapp"
            value={values.contatoWhatsapp}
            onChange={(event) => update({ contatoWhatsapp: event.target.value })}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            className={inputClass}
            aria-invalid={Boolean(errors.contatoWhatsapp)}
          />
        </Field>
      </div>

      <Field label="Pacote fotográfico">
        <PackagePicker
          value={values.pacoteId}
          onChange={handlePackageSelect}
          includeId={appointment?.pacoteId}
          error={errors.pacoteId}
        />
      </Field>

      {pacoteSelecionado ? (
        <div className="rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 ring-1 ring-line">
              <Images className="size-3" />
              {pacoteSelecionado.quantidadeFotosInclusas} fotos inclusas
            </span>
            {pacoteSelecionado.quantidadeVideosInclusos > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 ring-1 ring-line">
                {pacoteSelecionado.quantidadeVideosInclusos}{' '}
                {pacoteSelecionado.quantidadeVideosInclusos === 1 ? 'vídeo' : 'vídeos'} incluso
                {pacoteSelecionado.quantidadeVideosInclusos === 1 ? '' : 's'}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 ring-1 ring-line">
              Extra{' '}
              {pacoteSelecionado.faixasFotoExtra &&
              pacoteSelecionado.faixasFotoExtra.length > 0
                ? `a partir de ${formatBRL(
                    menorValorFotoExtra(
                      pacoteSelecionado.valorFotoExtra,
                      pacoteSelecionado.faixasFotoExtra,
                    ),
                  )}/foto`
                : `${formatBRL(pacoteSelecionado.valorFotoExtra)}/foto`}
            </span>
          </div>

          {temPromocaoDisponivel ? (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg bg-surface px-3 py-2 ring-1 ring-line">
              <input
                type="checkbox"
                checked={values.promocaoAplicada}
                onChange={(event) => handlePromocaoToggle(event.target.checked)}
                className="mt-0.5 size-4 accent-brand-600"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  Aplicar promoção
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {pacoteSelecionado.promocao?.rotulo || 'Promoção ativa'} ·{' '}
                  {formatBRL(
                    valorEfetivoPacote(pacoteSelecionado, values.promocaoAplicada),
                  )}{' '}
                  em vez de {formatBRL(pacoteSelecionado.valor)}
                </span>
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Data" htmlFor="appointment-date" error={errors.data} className="col-span-2 sm:col-span-1">
          <input
            id="appointment-date"
            type="date"
            value={values.data}
            onChange={(event) => update({ data: event.target.value })}
            className={inputClass}
            aria-invalid={Boolean(errors.data)}
          />
        </Field>

        <Field label="Início" htmlFor="appointment-start" error={errors.horaInicio}>
          <input
            id="appointment-start"
            type="time"
            step={300}
            value={values.horaInicio}
            onChange={(event) => update({ horaInicio: event.target.value })}
            className={inputClass}
            aria-invalid={Boolean(errors.horaInicio)}
          />
        </Field>

        <Field label="Duração (min)" htmlFor="appointment-duration" error={errors.duracaoMinutos}>
          <input
            id="appointment-duration"
            type="number"
            min={15}
            step={15}
            value={values.duracaoMinutos}
            onChange={(event) => update({ duracaoMinutos: event.target.value })}
            className={inputClass}
            aria-invalid={Boolean(errors.duracaoMinutos)}
          />
        </Field>
      </div>

      {previewEnd ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="size-3.5" />
          Termina às <span className="font-semibold text-ink">{formatTimeValue(previewEnd)}</span>
          <span className="text-slate-400">·</span>
          {formatDuration(duration)}
        </p>
      ) : null}

      <Field label="Local do ensaio" htmlFor="appointment-local" error={errors.local}>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {LOCAL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => update({ local: preset })}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition',
                values.local === preset
                  ? 'bg-brand-50 text-brand-700 ring-brand-200'
                  : 'bg-surface text-muted ring-line hover:bg-slate-50 hover:text-ink',
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id="appointment-local"
            value={values.local}
            onChange={(event) => update({ local: event.target.value })}
            placeholder="Ex.: Estúdio Photoizer"
            className={cn(inputClass, 'pl-10')}
            aria-invalid={Boolean(errors.local)}
          />
        </div>
      </Field>

      <div className="rounded-xl border border-line bg-canvas/60 p-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted" />
          <p className="text-xs font-semibold text-ink">Valores e entrada</p>
        </div>

        <div className="mt-3 space-y-3">
          <Field label="Valor do pacote" htmlFor="appointment-value" error={errors.valorAcordado}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                R$
              </span>
              <input
                id="appointment-value"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={values.valorAcordado}
                onChange={(event) => handleTotalChange(event.target.value)}
                placeholder="0,00"
                className={cn(inputClass, 'pl-10')}
                aria-invalid={Boolean(errors.valorAcordado)}
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Entrada (%)"
              htmlFor="appointment-deposit-percent"
              error={errors.percentualEntrada}
            >
              <div className="relative">
                <input
                  id="appointment-deposit-percent"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.percentualEntrada}
                  onChange={(event) => handlePercentualChange(event.target.value)}
                  className={cn(inputClass, 'pr-9')}
                  aria-invalid={Boolean(errors.percentualEntrada)}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
                  %
                </span>
              </div>
            </Field>

            <Field
              label="Entrada (R$)"
              htmlFor="appointment-deposit-value"
              error={errors.valorEntrada}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                  R$
                </span>
                <input
                  id="appointment-deposit-value"
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={values.valorEntrada}
                  onChange={(event) => handleEntradaValueChange(event.target.value)}
                  className={cn(inputClass, 'pl-10')}
                  aria-invalid={Boolean(errors.valorEntrada)}
                />
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs ring-1 ring-line">
            <span className="text-muted">Saldo restante</span>
            <span className="font-semibold text-ink">{formatBRL(saldoRestante)}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 ring-1 ring-line">
            <div>
              <p className="text-xs font-medium text-ink">Entrada já paga</p>
              <p className="text-[10px] text-muted">
                Marque se o recebimento já foi confirmado pelo estúdio.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.entradaPaga}
              aria-label="Entrada já paga"
              onClick={() => update({ entradaPaga: !values.entradaPaga })}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                values.entradaPaga ? 'bg-brand-600' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                  values.entradaPaga ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <Field label="Observações" htmlFor="appointment-notes">
        <textarea
          id="appointment-notes"
          value={values.observacoes}
          onChange={(event) => update({ observacoes: event.target.value })}
          placeholder="Orientações, preferências e combinados com o cliente"
          rows={3}
          className={textareaClass}
        />
      </Field>

      <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted" />
          <p className="text-xs font-semibold text-ink">Integrações do atendimento</p>
        </div>
        <div className="mt-2 grid gap-1.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <Wallet className="size-3.5" /> Sinal e pagamento pendente
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-3.5" /> Lembrete automático via WhatsApp
          </span>
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" /> Galeria criada após o ensaio realizado
          </span>
        </div>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-brand-700">
          Integrações
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          <Check className="size-4" />
          {appointment ? 'Salvar alterações' : 'Criar ensaio'}
        </Button>
      </div>
    </form>
  )
}
