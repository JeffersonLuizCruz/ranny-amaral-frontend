import type {
  PagamentoEntrada,
  PagamentoSaldo,
  PagamentoStatus,
} from './payments'
import type { AgendamentoEnsaio, PacoteFotografico } from './types'

export type ContratoAceiteStatus =
  | 'rascunho'
  | 'pendente'
  | 'aceito'
  | 'expirado'
  | 'cancelado'

export type ContratoPagamentoStatus = PagamentoStatus

export type SolicitacaoAceiteStatus =
  | 'pendente'
  | 'visualizada'
  | 'aceita'
  | 'expirada'
  | 'cancelada'

export interface EstudioConfig {
  nome: string
  razaoSocial?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  email?: string
  telefone?: string
  responsavel?: string
  site?: string
  foro?: string
  percentualEntradaPadrao: number
  chavePix?: string
  instrucoesPagamento?: string
  prazoPagamentoDias?: number
}

export interface ContratoClausula {
  id: string
  titulo: string
  corpo: string
}

export interface ContratoSnapshotCliente {
  nome: string
  whatsapp?: string
  email?: string
  documento?: string
  tipoDocumento?: 'rg' | 'cpf'
  cidade?: string
}

export interface ContratoSnapshot {
  cliente: ContratoSnapshotCliente
  pacote?: Pick<
    PacoteFotografico,
    | 'nome'
    | 'duracaoMinutos'
    | 'valor'
    | 'itensInclusos'
    | 'quantidadeFotosInclusas'
    | 'quantidadeVideosInclusos'
    | 'valorFotoExtra'
  > & {
    promocaoAplicada?: { valorPromocional: number; rotulo?: string }
    valorEfetivo?: number
  }
  agendamento?: Pick<
    AgendamentoEnsaio,
    'dataHoraInicio' | 'dataHoraFim' | 'local' | 'valorAcordado'
  >
  estudio: EstudioConfig
  modeloVersao: number
}

export interface DadosAceiteInput {
  nomeCompleto: string
  tipoDocumento: 'rg' | 'cpf'
  documento: string
  cidade: string
  whatsapp?: string
}

export interface DadosAceite extends DadosAceiteInput {
  aceitoEm: string
  protocolo: string
  ip?: string
  userAgent?: string
  hashConteudo?: string
}

export type ContratoEventoTipo =
  | 'criado'
  | 'atualizado'
  | 'link_gerado'
  | 'link_visualizado'
  | 'aceite_registrado'
  | 'cliente_criado'
  | 'cliente_vinculado'
  | 'comprovante_enviado'
  | 'pagamento_confirmado'
  | 'pagamento_rejeitado'
  | 'saldo_recebido'
  | 'saldo_isento'
  | 'link_expirado'
  | 'link_cancelado'
  | 'contrato_cancelado'
  | 'reaberto'
  | 'pdf_gerado'
  | 'duplicado'

export interface ContratoEvento {
  id: string
  tipo: ContratoEventoTipo
  em: string
  detalhe?: string
}

export interface Contrato {
  id: string
  numero: string
  /** Pode ficar vazio até o cliente aceitar o contrato. */
  clienteId?: string
  agendamentoId?: string
  pacoteId?: string
  modeloId: string
  statusAceite: ContratoAceiteStatus
  statusPagamento: ContratoPagamentoStatus
  titulo: string
  clausulas: ContratoClausula[]
  /** Cláusulas originais do modelo, com placeholders, para re-resolver no aceite. */
  clausulasModelo?: ClausulaModelo[]
  snapshot: ContratoSnapshot
  /** Valor total do pacote. */
  valorTotal: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  pagamento: PagamentoEntrada
  /** Saldo final recebido manualmente pelo staff após o ensaio. */
  pagamentoFinal: PagamentoSaldo
  statusPagamentoFinal: PagamentoStatus
  formaPagamento: string
  condicoesPagamento?: string
  dataEmissao: string
  dataValidade?: string
  solicitacaoAtualId?: string
  aceite?: DadosAceite
  historico: ContratoEvento[]
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export interface SolicitacaoAceite {
  id: string
  contratoId: string
  token: string
  status: SolicitacaoAceiteStatus
  criadaEm: string
  expiraEm: string
  visualizadaEm?: string
  dadosAceite?: DadosAceite
}

export interface ClausulaModelo {
  id: string
  titulo: string
  corpo: string
}

export interface ModeloContrato {
  id: string
  nome: string
  descricao: string
  clausulas: ClausulaModelo[]
  ativo: boolean
  versao: number
  createdAt: string
  updatedAt: string
}

export type ContratoDraft = Omit<
  Contrato,
  | 'id'
  | 'numero'
  | 'statusAceite'
  | 'statusPagamento'
  | 'historico'
  | 'aceite'
  | 'solicitacaoAtualId'
  | 'createdAt'
  | 'updatedAt'
>

export type ModeloContratoDraft = Omit<
  ModeloContrato,
  'id' | 'versao' | 'createdAt' | 'updatedAt'
>

export const ACEITE_STATUS_META: Record<
  ContratoAceiteStatus,
  { label: string; description: string; badge: string; dot: string }
> = {
  rascunho: {
    label: 'Rascunho',
    description: 'Contrato criado, link ainda não gerado.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  pendente: {
    label: 'Aguardando aceite',
    description: 'Link gerado e aguardando o cliente.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  aceito: {
    label: 'Aceite confirmado',
    description: 'Cliente preencheu os dados e aceitou o contrato.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  expirado: {
    label: 'Link expirado',
    description: 'O link de aceite expirou antes do aceite.',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
  },
  cancelado: {
    label: 'Cancelado',
    description: 'Contrato cancelado pelo estúdio.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
}

export const ACEITE_STATUS_ORDER: ContratoAceiteStatus[] = [
  'rascunho',
  'pendente',
  'aceito',
  'expirado',
  'cancelado',
]
