import type { Cliente, ClienteDraft, ClienteOrigem } from '@/domain/types'
import { formatWhatsApp, isValidWhatsApp } from '@/shared/lib/whatsapp'

export interface ClientFormValues {
  nome: string
  whatsapp: string
  email: string
  documento: string
  tipoDocumento: 'rg' | 'cpf'
  cidade: string
  origem: ClienteOrigem
  observacoes: string
}

export type ClientFormErrors = Partial<Record<'nome' | 'whatsapp' | 'email', string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createEmptyClientValues(): ClientFormValues {
  return {
    nome: '',
    whatsapp: '',
    email: '',
    documento: '',
    tipoDocumento: 'cpf',
    cidade: '',
    origem: 'instagram',
    observacoes: '',
  }
}

export function clientToFormValues(cliente: Cliente): ClientFormValues {
  return {
    nome: cliente.nome,
    whatsapp: cliente.whatsapp,
    email: cliente.email ?? '',
    documento: cliente.documento ?? '',
    tipoDocumento: cliente.tipoDocumento ?? 'cpf',
    cidade: cliente.cidade ?? '',
    origem: cliente.origem,
    observacoes: cliente.observacoes ?? '',
  }
}

export function validateClientForm(values: ClientFormValues): {
  errors: ClientFormErrors
  draft?: ClienteDraft
} {
  const errors: ClientFormErrors = {}
  const nome = values.nome.trim()
  const whatsapp = values.whatsapp.trim()
  const email = values.email.trim()
  const documento = values.documento.trim()
  const cidade = values.cidade.trim()

  if (!nome) errors.nome = 'Informe o nome do cliente.'
  if (whatsapp && !isValidWhatsApp(whatsapp)) {
    errors.whatsapp = 'Use um WhatsApp com DDD (10 ou 11 dígitos).'
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    draft: {
      nome,
      whatsapp: whatsapp ? formatWhatsApp(whatsapp) : '',
      email: email || undefined,
      documento: documento || undefined,
      tipoDocumento: documento ? values.tipoDocumento : undefined,
      cidade: cidade || undefined,
      origem: values.origem,
      observacoes: values.observacoes.trim() || undefined,
    },
  }
}
