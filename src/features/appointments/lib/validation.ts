import { addMinutes } from 'date-fns'

import type {
  AgendamentoDraft,
  AgendamentoEnsaio,
  AgendamentoStatus,
} from '@/domain/types'
import {
  calcularPercentualEntrada,
  calcularSaldoRestante,
  calcularValorEntrada,
  statusPagamentoInicial,
} from '@/domain/payments'
import {
  combineDateAndTime,
  formatTimeValue,
  fromDateKey,
  minutesBetween,
  toDateKey,
} from '@/shared/lib/date'
import { parseCurrencyInput } from '@/shared/lib/currency'
import { formatWhatsApp, isValidWhatsApp } from '@/shared/lib/whatsapp'

export interface AppointmentFormValues {
  clienteId: string
  contatoNome: string
  contatoWhatsapp: string
  pacoteId: string
  data: string
  horaInicio: string
  duracaoMinutos: string
  local: string
  status: AgendamentoStatus
  valorAcordado: string
  percentualEntrada: string
  valorEntrada: string
  entradaPaga: boolean
  promocaoAplicada: boolean
  observacoes: string
}

export type AppointmentFormErrors = Partial<
  Record<
    | 'pacoteId'
    | 'data'
    | 'horaInicio'
    | 'duracaoMinutos'
    | 'local'
    | 'valorAcordado'
    | 'percentualEntrada'
    | 'valorEntrada'
    | 'contatoWhatsapp',
    string
  >
>

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function createEmptyAppointmentValues(
  defaultDate: string,
  defaultStartTime: string,
  defaultClienteId?: string | null,
  defaultPercentual = 30,
): AppointmentFormValues {
  const parsedDate = fromDateKey(defaultDate)
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  const safeTime = TIME_PATTERN.test(defaultStartTime) ? defaultStartTime : '09:00'

  return {
    clienteId: defaultClienteId ?? '',
    contatoNome: '',
    contatoWhatsapp: '',
    pacoteId: '',
    data: toDateKey(safeDate),
    horaInicio: safeTime,
    duracaoMinutos: '60',
    local: 'Estúdio',
    status: 'reservado',
    valorAcordado: '',
    percentualEntrada: String(defaultPercentual),
    valorEntrada: '',
    entradaPaga: false,
    promocaoAplicada: false,
    observacoes: '',
  }
}

export function appointmentToFormValues(
  appointment: AgendamentoEnsaio,
): AppointmentFormValues {
  const start = new Date(appointment.dataHoraInicio)

  return {
    clienteId: appointment.clienteId ?? '',
    contatoNome: appointment.contato?.nome ?? '',
    contatoWhatsapp: appointment.contato?.whatsapp ?? '',
    pacoteId: appointment.pacoteId,
    data: toDateKey(start),
    horaInicio: formatTimeValue(start),
    duracaoMinutos: String(
      minutesBetween(appointment.dataHoraInicio, appointment.dataHoraFim),
    ),
    local: appointment.local,
    status: appointment.status,
    valorAcordado: String(appointment.valorAcordado),
    percentualEntrada: String(appointment.percentualEntrada),
    valorEntrada: String(appointment.valorEntrada),
    entradaPaga: appointment.pagamentoEntrada.status === 'confirmado',
    promocaoAplicada: Boolean(appointment.condicoesPacote?.promocaoAplicada),
    observacoes: appointment.observacoes ?? '',
  }
}

export function validateAppointmentForm(values: AppointmentFormValues): {
  errors: AppointmentFormErrors
  draft?: AgendamentoDraft
} {
  const errors: AppointmentFormErrors = {}

  if (!values.pacoteId) errors.pacoteId = 'Selecione um pacote fotográfico.'

  const parsedDate = fromDateKey(values.data)
  if (!values.data || Number.isNaN(parsedDate.getTime())) {
    errors.data = 'Escolha uma data válida.'
  }

  if (!TIME_PATTERN.test(values.horaInicio)) {
    errors.horaInicio = 'Informe um horário válido.'
  }

  const duration = Number(values.duracaoMinutos)
  if (!values.duracaoMinutos.trim() || !Number.isFinite(duration) || duration < 15) {
    errors.duracaoMinutos = 'A duração mínima é de 15 minutos.'
  }

  const local = values.local.trim()
  if (!local) errors.local = 'Informe o local do ensaio.'

  const contatoWhatsapp = values.contatoWhatsapp.trim()
  if (contatoWhatsapp && !isValidWhatsApp(contatoWhatsapp)) {
    errors.contatoWhatsapp = 'Use um WhatsApp com DDD (10 ou 11 dígitos).'
  }

  const valor = parseCurrencyInput(values.valorAcordado)
  if (!values.valorAcordado.trim() || valor < 0) {
    errors.valorAcordado = 'Informe um valor válido.'
  }

  const percentualInput = values.percentualEntrada.trim()
  const valorEntradaInput = values.valorEntrada.trim()
  let percentual = percentualInput ? Number(percentualInput) : 0
  let valorEntrada = valorEntradaInput ? parseCurrencyInput(valorEntradaInput) : 0

  if (valorEntradaInput) {
    if (!Number.isFinite(valorEntrada) || valorEntrada < 0 || valorEntrada > valor) {
      errors.valorEntrada = 'A entrada deve ficar entre zero e o valor do pacote.'
    }
    percentual = calcularPercentualEntrada(valor, valorEntrada)
  } else if (percentualInput) {
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      errors.percentualEntrada = 'Informe um percentual entre 0 e 100.'
    }
    valorEntrada = calcularValorEntrada(valor, percentual)
  } else {
    errors.percentualEntrada = 'Informe o valor ou o percentual de entrada.'
  }

  if (Object.keys(errors).length > 0) return { errors }

  const start = combineDateAndTime(values.data, values.horaInicio)
  const end = addMinutes(start, duration)
  const saldoRestante = calcularSaldoRestante(valor, valorEntrada)
  const statusPagamento = statusPagamentoInicial(valorEntrada, values.entradaPaga)

  return {
    errors,
    draft: {
      clienteId: values.clienteId || undefined,
      contato:
        values.contatoNome.trim() || contatoWhatsapp
          ? {
              nome: values.contatoNome.trim() || undefined,
              whatsapp: contatoWhatsapp ? formatWhatsApp(contatoWhatsapp) : undefined,
            }
          : undefined,
      pacoteId: values.pacoteId,
      dataHoraInicio: start.toISOString(),
      dataHoraFim: end.toISOString(),
      local,
      status: values.status,
      valorAcordado: valor,
      valorEntrada,
      percentualEntrada: percentual,
      saldoRestante,
      pagamentoEntrada: {
        valor: valorEntrada,
        percentual,
        status: statusPagamento,
        confirmadoEm:
          statusPagamento === 'confirmado' ? new Date().toISOString() : undefined,
        confirmadoPor: statusPagamento === 'confirmado' ? 'Equipe do estúdio' : undefined,
      },
      observacoes: values.observacoes.trim() || undefined,
    },
  }
}
