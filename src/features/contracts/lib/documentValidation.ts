import { formatWhatsApp, isValidWhatsApp } from '@/shared/lib/whatsapp'
import type { DadosAceiteInput } from '@/domain/contracts'

export type AcceptanceFormValues = Omit<DadosAceiteInput, 'whatsapp'> & {
  whatsapp: string
  aceite: boolean
}

export type AcceptanceFormErrors = Partial<
  Record<'nomeCompleto' | 'documento' | 'cidade' | 'whatsapp' | 'aceite' | 'comprovante', string>
>

export function createEmptyAcceptanceValues(
  nomeCompleto = '',
  whatsapp = '',
): AcceptanceFormValues {
  return {
    nomeCompleto,
    tipoDocumento: 'cpf',
    documento: '',
    cidade: '',
    whatsapp,
    aceite: false,
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCPF(value: string): boolean {
  const digits = digitsOnly(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calculateDigit = (base: string, factor: number): number => {
    let total = 0
    for (const character of base) {
      total += Number(character) * factor
      factor -= 1
    }
    const remainder = (total * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const first = calculateDigit(digits.slice(0, 9), 10)
  const second = calculateDigit(digits.slice(0, 10), 11)

  return first === Number(digits[9]) && second === Number(digits[10])
}

export function isValidRG(value: string): boolean {
  const cleaned = value.trim()
  return /^[0-9A-Za-z.-]{5,20}$/.test(cleaned)
}

export function validateAcceptanceForm(values: AcceptanceFormValues): {
  errors: AcceptanceFormErrors
  draft?: DadosAceiteInput
} {
  const errors: AcceptanceFormErrors = {}
  const nomeCompleto = values.nomeCompleto.trim()
  const documento = values.documento.trim()
  const cidade = values.cidade.trim()
  const whatsapp = values.whatsapp.trim()

  if (nomeCompleto.length < 3) {
    errors.nomeCompleto = 'Informe o nome completo.'
  }

  if (!documento) {
    errors.documento = 'Informe o documento.'
  } else if (values.tipoDocumento === 'cpf' && !isValidCPF(documento)) {
    errors.documento = 'Informe um CPF válido.'
  } else if (values.tipoDocumento === 'rg' && !isValidRG(documento)) {
    errors.documento = 'Informe um RG válido.'
  }

  if (cidade.length < 2) {
    errors.cidade = 'Informe a cidade.'
  }

  if (whatsapp && !isValidWhatsApp(whatsapp)) {
    errors.whatsapp = 'Use um WhatsApp com DDD (10 ou 11 dígitos).'
  }

  if (!values.aceite) {
    errors.aceite = 'É necessário confirmar o aceite do contrato.'
  }

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    draft: {
      nomeCompleto,
      tipoDocumento: values.tipoDocumento,
      documento,
      cidade,
      whatsapp: whatsapp ? formatWhatsApp(whatsapp) : undefined,
    },
  }
}
