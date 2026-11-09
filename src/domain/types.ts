import type { PagamentoEntrada, PagamentoSaldo, PagamentoStatus } from './payments'

export type CalendarView = 'month' | 'week' | 'day'

export type AgendamentoStatus = 'reservado' | 'confirmado' | 'realizado' | 'cancelado'

export type ClienteOrigem =
  | 'instagram'
  | 'indicacao'
  | 'google'
  | 'whatsapp'
  | 'site'
  | 'contrato'
  | 'outro'

export interface PromocaoPacote {
  ativa: boolean
  /** Valor total do pacote durante a promoção. */
  valorPromocional: number
  validaAte?: string
  rotulo?: string
}

export interface PacoteFotografico {
  id: string
  nome: string
  duracaoMinutos: number
  valor: number
  descricao: string
  corHex: string
  itensInclusos: string[]
  ativo: boolean
  /** Quantidade de fotos inclusas no pacote. */
  quantidadeFotosInclusas: number
  /** Quantidade de vídeos inclusos no pacote. */
  quantidadeVideosInclusos: number
  /** Valor cobrado por cada foto adicional. */
  valorFotoExtra: number
  promocao?: PromocaoPacote
  createdAt: string
  updatedAt: string
}

/**
 * Condições comerciais congeladas no momento da venda.
 * Protege o ensaio de alterações posteriores no catálogo de pacotes.
 */
export interface CondicoesPacote {
  quantidadeFotosInclusas: number
  quantidadeVideosInclusos: number
  valorFotoExtra: number
  valorTabela: number
  promocaoAplicada?: {
    valorPromocional: number
    rotulo?: string
  }
}

export interface Cliente {
  id: string
  nome: string
  whatsapp: string
  email?: string
  documento?: string
  tipoDocumento?: 'rg' | 'cpf'
  cidade?: string
  origem: ClienteOrigem
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export interface ContatoReserva {
  nome?: string
  whatsapp?: string
}

export interface AgendamentoEnsaio {
  id: string
  /** Pode ficar vazio até o cliente aceitar o contrato. */
  clienteId?: string
  contato?: ContatoReserva
  contratoId?: string
  pacoteId: string
  /** ISO 8601 string (UTC). */
  dataHoraInicio: string
  /** ISO 8601 string (UTC). */
  dataHoraFim: string
  local: string
  status: AgendamentoStatus
  observacoes?: string
  /** Valor total do pacote/ensaio. */
  valorAcordado: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  pagamentoEntrada: PagamentoEntrada
  /** Saldo final recebido manualmente pelo staff. */
  pagamentoFinal?: PagamentoSaldo
  /** Campos derivados pelo backend para evitar regra duplicada no frontend. */
  statusEntrada: PagamentoStatus
  statusSaldoFinal: PagamentoStatus
  entradaQuitada: boolean
  saldoQuitado: boolean
  quitado: boolean
  valorRecebido: number
  valorPendente: number
  /** Snapshot das regras de mídia e preço de foto extra. */
  condicoesPacote?: CondicoesPacote

  // Pontos de extensão opcionais para os próximos módulos.
  financeiro?: {
    sinalStatus: 'nao_solicitado' | 'pendente' | 'recebido'
    sinalValor?: number
    linkPagamento?: string
  }
  /** Referência para a galeria do ensaio. */
  galeriaId?: string
  /** @deprecated Mantido apenas para compatibilidade com dados antigos. */
  galeria?: {
    status: 'nao_criada' | 'em_selecao' | 'entregue'
    linkSelecao?: string
  }
  lembretes?: {
    whatsappEnviadoEm?: string
  }

  createdAt: string
  updatedAt: string
}

/** Payloads aceitos pelas stores. */
export type PacoteDraft = Omit<PacoteFotografico, 'id' | 'createdAt' | 'updatedAt'>
export type ClienteDraft = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>
export type AgendamentoDraft = Omit<
  AgendamentoEnsaio,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'statusEntrada'
  | 'statusSaldoFinal'
  | 'entradaQuitada'
  | 'saldoQuitado'
  | 'quitado'
  | 'valorRecebido'
  | 'valorPendente'
>

export type AppointmentDrawerMode = 'create' | 'edit' | 'view'

export interface AppointmentDrawerState {
  mode: AppointmentDrawerMode | null
  appointmentId: string | null
  /** `yyyy-MM-dd` local date key used to pre-fill a new appointment. */
  defaultDate: string | null
  /** `HH:mm` used to pre-fill a new appointment. */
  defaultStartTime: string | null
  /** Optional existing client preselected when creating from the client list. */
  defaultClienteId: string | null
}

export type AgendaPaymentFilter =
  | 'entrada_pendente'
  | 'saldo_pendente'
  | 'quitado'

export interface AgendaFilters {
  /** Empty means every status is visible. */
  hiddenStatuses: AgendamentoStatus[]
  /** Empty means every package is visible. */
  hiddenPackageIds: string[]
  /** Empty means every financial state is visible. */
  hiddenPaymentStates: AgendaPaymentFilter[]
}
