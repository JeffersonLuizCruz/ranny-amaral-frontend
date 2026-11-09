export type PagamentoStatus = 'pendente' | 'confirmado' | 'isento' | 'cancelado'

export interface ComprovantePagamento {
  arquivoKey: string
  nomeArquivo: string
  mimeType: string
  tamanho: number
  enviadoEm: string
}

export interface ComprovanteRejeicao {
  motivo: string
  rejeitadoEm: string
}

export interface PagamentoEntrada {
  valor: number
  percentual: number
  status: PagamentoStatus
  arquivoId?: string
  comprovante?: ComprovantePagamento
  rejeicao?: ComprovanteRejeicao
  confirmadoEm?: string
  confirmadoPor?: string
  observacoes?: string
}

export type FormaPagamentoSaldo = 'pix' | 'dinheiro' | 'outro'

/**
 * Saldo final recebido manualmente pelo staff durante/logo após o ensaio.
 * Não usa comprovante público: o registro é interno do estúdio.
 */
export interface PagamentoSaldo {
  valor: number
  status: PagamentoStatus
  formaPagamento?: FormaPagamentoSaldo
  recebidoEm?: string
  recebidoPor?: string
  observacoes?: string
}

type PagamentoStatusMeta = {
  label: string
  description: string
  badge: string
  dot: string
}

/**
 * A entrada e o saldo final compartilham o mesmo enum de status, mas sao
 * conceitos financeiros distintos. Manter catalogos separados evita que um
 * "confirmado" da entrada seja lido como quitacao do ensaio inteiro.
 */
export const ENTRADA_STATUS_META: Record<PagamentoStatus, PagamentoStatusMeta> = {
  pendente: {
    label: 'Entrada pendente',
    description: 'Entrada ainda não confirmada pelo estúdio.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  confirmado: {
    label: 'Entrada confirmada',
    description: 'Entrada recebida e confirmada pelo estúdio.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  isento: {
    label: 'Entrada isenta',
    description: 'Este ensaio não possui entrada a pagar.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  cancelado: {
    label: 'Entrada cancelada',
    description: 'A entrada foi cancelada junto com o contrato.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
}

export const SALDO_FINAL_STATUS_META: Record<PagamentoStatus, PagamentoStatusMeta> = {
  pendente: {
    label: 'Saldo final pendente',
    description: 'Saldo final ainda não recebido pelo estúdio.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  confirmado: {
    label: 'Saldo final recebido',
    description: 'Saldo final recebido e confirmado pelo estúdio.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  isento: {
    label: 'Saldo final isento',
    description: 'Este ensaio não possui saldo final a receber.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  cancelado: {
    label: 'Saldo final cancelado',
    description: 'O saldo final foi cancelado junto com o contrato.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
}

export function calcularValorEntrada(valorPacote: number, percentual: number): number {
  if (!Number.isFinite(valorPacote) || !Number.isFinite(percentual)) return 0
  const safePercentual = Math.max(0, Math.min(100, percentual))
  return Math.round(((valorPacote * safePercentual) / 100) * 100) / 100
}

export function calcularPercentualEntrada(valorPacote: number, valorEntrada: number): number {
  if (!Number.isFinite(valorPacote) || valorPacote <= 0) return 0
  return Math.round((valorEntrada / valorPacote) * 10000) / 100
}

export function calcularSaldoRestante(valorPacote: number, valorEntrada: number): number {
  return Math.max(0, Math.round((valorPacote - valorEntrada) * 100) / 100)
}

export function statusPagamentoInicial(
  valorEntrada: number,
  entradaPaga: boolean,
): PagamentoStatus {
  if (valorEntrada <= 0) return 'isento'
  return entradaPaga ? 'confirmado' : 'pendente'
}
