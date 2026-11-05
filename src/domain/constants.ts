import type { AgendamentoStatus, ClienteOrigem } from './types'

export interface StatusMeta {
  label: string
  description: string
  /** Tinted chip used in lists and details. */
  badge: string
  /** Solid dot used in compact indicators. */
  dot: string
  /** Solid background used when a status needs emphasis. */
  solid: string
  text: string
}

export const STATUS_META: Record<AgendamentoStatus, StatusMeta> = {
  reservado: {
    label: 'Reservado',
    description: 'Reserva criada; contrato e pagamento pendentes.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white',
    text: 'text-amber-700',
  },
  confirmado: {
    label: 'Confirmado',
    description: 'Ensaio confirmado com o cliente.',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
    solid: 'bg-blue-600 text-white',
    text: 'text-blue-700',
  },
  realizado: {
    label: 'Realizado',
    description: 'Ensaio concluído.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-600 text-white',
    text: 'text-emerald-700',
  },
  cancelado: {
    label: 'Cancelado',
    description: 'Ensaio cancelado pelo cliente ou pelo estúdio.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
    solid: 'bg-slate-500 text-white',
    text: 'text-slate-500',
  },
}

export const STATUS_ORDER: AgendamentoStatus[] = [
  'reservado',
  'confirmado',
  'realizado',
  'cancelado',
]

export const ORIGEM_OPTIONS: Array<{ value: ClienteOrigem; label: string }> = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site', label: 'Site' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
]

export function origemLabel(origem: ClienteOrigem): string {
  return ORIGEM_OPTIONS.find((option) => option.value === origem)?.label ?? 'Outro'
}

export const LOCAL_PRESETS = ['Estúdio', 'Externo', 'Domicílio', 'Outro'] as const

/** Paleta sugerida para os pacotes. */
export const PACKAGE_COLORS = [
  '#7C3AED',
  '#0284C7',
  '#D97706',
  '#059669',
  '#E11D48',
  '#4F46E5',
  '#0D9488',
  '#EA580C',
] as const
