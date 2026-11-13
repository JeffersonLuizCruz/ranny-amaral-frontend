import type { FormaPagamentoSaldo } from './payments'
import type { FaixaFotoExtra } from './types'

export type FaseGaleriaPublica =
  | 'selecao'
  | 'aguardando_pagamento'
  | 'em_liberacao'
  | 'entregue'
  | 'cancelada'

export type GaleriaStatus =
  | 'nao_criada'
  | 'aguardando_upload'
  | 'em_selecao'
  | 'selecao_enviada'
  | 'em_edicao'
  | 'entregue'
  | 'cancelada'
  | 'expurgada'

export type ExpurgoStatus =
  | 'nenhum'
  | 'agendado'
  | 'executando'
  | 'executado'
  | 'cancelado'

export type MidiaTipo = 'foto' | 'video'
export type MidiaStatus = 'original' | 'editada'
export type MidiaFinalidade = 'edicao' | 'pronta'

export interface MidiaGaleria {
  id: string
  tipo: MidiaTipo
  nomeArquivo: string
  mimeType: string
  tamanho: number
  arquivoKey?: string
  status: MidiaStatus
  /** edicao = original que sera editado; pronta = arquivo final publicado pelo estudio. */
  finalidade: MidiaFinalidade
  originalId?: string
  numero: number
  uploadedAt: string
  thumbUrl?: string
  webUrl?: string
  originalUrl?: string
  editadaUrl?: string
  editadaDisponivel?: boolean
  editadaProcessando?: boolean
  /** Indica que a previa publica ja tem a marca d'agua aplicada na imagem. */
  previaMarcada?: boolean
  liberadaEm?: string
  disponivelParaDownload?: boolean
  liberacaoAutomatica?: boolean
  processamentoStatus?: 'enviando' | 'processando' | 'disponivel' | 'falha' | 'removida'
  erroProcessamento?: string
}

export type SelecaoStatus = 'rascunho' | 'enviada'

export interface SelecaoGaleria {
  status: SelecaoStatus
  protocolo?: string
  fotoIds: string[]
  videoIds: string[]
  fotosExtras: number
  valorExtras: number
  enviadaEm?: string
}

export type PedidoExtrasStatus = 'pendente' | 'pago' | 'isento' | 'cancelado'

export interface LiberacaoManual {
  por: string
  em: string
  motivo: string
}

export interface FaixaAplicada {
  quantidade: number
  valorUnitario: number
  subtotal: number
}

export interface PedidoExtras {
  id: string
  quantidadeFotos: number
  valorUnitario: number
  valorMedioUnitario?: number
  valorTotal: number
  detalhamento?: FaixaAplicada[]
  status: PedidoExtrasStatus
  formaPagamento?: FormaPagamentoSaldo
  confirmadoEm?: string
  confirmadoPor?: string
  liberacaoManual?: LiberacaoManual
  chavePix?: string
  instrucoesPagamento?: string
  comprovanteNome?: string
  comprovanteEnviadoEm?: string
  comprovanteUrl?: string
}

export interface ResumoExtras {
  quantidadeTotal: number
  valorTotal: number
  quantidadeCoberta: number
  valorCoberto: number
  quantidadePendente: number
  valorPendente: number
}

export type EntregaStatus = 'nao_publicada' | 'disponivel' | 'revogada'

export interface DownloadEntrega {
  em: string
  quantidade: number
}

export interface EntregaGaleria {
  token: string
  status: EntregaStatus
  publicadaEm?: string
  expiraEm?: string
  primeiroDownloadEm?: string
  quantidadeDownloads: number
  downloads: DownloadEntrega[]
}

export type EventoGaleriaTipo =
  | 'criada'
  | 'midia_enviada'
  | 'midia_removida'
  | 'midia_editada'
  | 'midia_editada_removida'
  | 'midia_finalidade_alterada'
  | 'selecao_publicada'
  | 'selecao_reaberta'
  | 'selecao_enviada'
  | 'extras_confirmados'
  | 'extras_isentos'
  | 'edicao_liberada'
  | 'edicao_iniciada'
  | 'pronta_entrega'
  | 'entrega_publicada'
  | 'entrega_revogada'
  | 'entrega_lote_liberado'
  | 'entrega_liberacao_revogada'
  | 'liberacao_automatica_alterada'
  | 'download_registrado'
  | 'comprovante_extras_enviado'
  | 'expurgo_solicitado'
  | 'expurgo_executado'
  | 'expurgo_cancelado'
  | 'cancelada'

export interface EventoGaleria {
  id: string
  tipo: EventoGaleriaTipo
  em: string
  detalhe?: string
}

export interface GaleriaEnsaio {
  id: string
  agendamentoId: string
  contratoId?: string
  clienteNome?: string
  pacoteNome?: string
  pacoteCorHex?: string
  status: GaleriaStatus
  fotosInclusas?: number
  videosInclusos?: number
  valorFotoExtra?: number
  faixasFotoExtra?: FaixaFotoExtra[]
  totalFotos?: number
  totalVideos?: number
  fotosDisponiveis?: number
  videosDisponiveis?: number
  /**
   * @deprecated RAW não é mais exposto na UI. Campos mantidos apenas para
   * compatibilidade de leitura de galerias antigas.
   */
  rawLiberado?: boolean
  /** @deprecated ver rawLiberado. */
  rawLiberadoEm?: string
  /** @deprecated ver rawLiberado. */
  rawLiberadoPor?: string
  zipBaixadoEm?: string
  zipConcluidoEm?: string
  expurgoStatus?: ExpurgoStatus
  expurgoSolicitadoEm?: string
  expurgoEfetivadoEm?: string
  bytesExpurgados?: number
  tokenSelecao?: string
  tokenGaleria?: string
  prazoSelecaoEm?: string
  fotosSelecionadas?: number
  fotosProntas?: number
  fotosLiberadas?: number
  videosSelecionados?: number
  videosLiberados?: number
  fase?: FaseGaleriaPublica
  midias: MidiaGaleria[]
  selecao?: SelecaoGaleria
  pedidoExtras?: PedidoExtras
  pedidosExtras?: PedidoExtras[]
  resumoExtras?: ResumoExtras
  entrega?: EntregaGaleria
  historico: EventoGaleria[]
  createdAt: string
  updatedAt: string
}

export interface GaleriaStatusMeta {
  label: string
  description: string
  badge: string
  dot: string
}

export type GaleriaStatusVisual = GaleriaStatus | 'baixada'

export const GALERIA_STATUS_META: Record<GaleriaStatusVisual, GaleriaStatusMeta> = {
  nao_criada: {
    label: 'Não criada',
    description: 'A galeria ainda não foi criada para este ensaio.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  aguardando_upload: {
    label: 'Aguardando upload',
    description: 'Envie as mídias originais para liberar a seleção.',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  em_selecao: {
    label: 'Em seleção',
    description: 'O cliente pode escolher as fotos e vídeos pelo link.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  selecao_enviada: {
    label: 'Seleção enviada',
    description: 'Seleção recebida. Verifique extras e inicie a edição.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-500',
  },
  em_edicao: {
    label: 'Em edição',
    description: 'A equipe está editando as mídias selecionadas.',
    badge: 'bg-purple-50 text-purple-700 ring-purple-200',
    dot: 'bg-purple-500',
  },
  entregue: {
    label: 'Entregue',
    description: 'Link de entrega publicado para o cliente.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  baixada: {
    label: 'Baixada',
    description: 'O cliente já baixou o ZIP da entrega.',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
  },
  cancelada: {
    label: 'Cancelada',
    description: 'A galeria foi cancelada.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  expurgada: {
    label: 'Expurgada',
    description: 'Os binários foram removidos do storage; metadados e financeiro permanecem.',
    badge: 'bg-slate-800 text-slate-100 ring-slate-700',
    dot: 'bg-slate-400',
  },
}

export const GALERIA_STATUS_ORDER: GaleriaStatus[] = [
  'aguardando_upload',
  'em_selecao',
  'selecao_enviada',
  'em_edicao',
  'entregue',
  'expurgada',
  'cancelada',
]

export type GaleriaFiltro = 'todas' | GaleriaStatus | 'baixadas'

export const GALERIA_FILTRO_ORDER: Exclude<GaleriaFiltro, 'todas'>[] = [
  ...GALERIA_STATUS_ORDER.filter((status) => status !== 'cancelada'),
  'baixadas',
  'cancelada',
]

export function contarMidias(
  midias: MidiaGaleria[],
  tipo: MidiaTipo,
  status: MidiaStatus = 'original',
): number {
  return midias.filter((midia) => midia.tipo === tipo && midia.status === status).length
}
