import type { FormaPagamentoSaldo } from './payments'
import type { FaixaFotoExtra } from './types'

export type GaleriaStatus =
  | 'nao_criada'
  | 'aguardando_upload'
  | 'em_selecao'
  | 'selecao_enviada'
  | 'em_edicao'
  | 'pronta_entrega'
  | 'entregue'
  | 'cancelada'

export type MidiaTipo = 'foto' | 'video'
export type MidiaStatus = 'original' | 'editada'

export interface MidiaGaleria {
  id: string
  tipo: MidiaTipo
  nomeArquivo: string
  mimeType: string
  tamanho: number
  arquivoKey?: string
  status: MidiaStatus
  originalId?: string
  numero: number
  uploadedAt: string
  thumbUrl?: string
  webUrl?: string
  originalUrl?: string
  editadaUrl?: string
  editadaDisponivel?: boolean
  editadaProcessando?: boolean
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
  | 'download_registrado'
  | 'comprovante_extras_enviado'
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
  status: GaleriaStatus
  fotosInclusas?: number
  videosInclusos?: number
  valorFotoExtra?: number
  faixasFotoExtra?: FaixaFotoExtra[]
  totalFotos?: number
  totalVideos?: number
  fotosDisponiveis?: number
  videosDisponiveis?: number
  rawLiberado?: boolean
  rawLiberadoEm?: string
  rawLiberadoPor?: string
  tokenSelecao?: string
  prazoSelecaoEm?: string
  midias: MidiaGaleria[]
  selecao?: SelecaoGaleria
  pedidoExtras?: PedidoExtras
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

export const GALERIA_STATUS_META: Record<GaleriaStatus, GaleriaStatusMeta> = {
  nao_criada: {
    label: 'Não criada',
    description: 'A galeria ainda não foi criada para este ensaio.',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  aguardando_upload: {
    label: 'Aguardando upload',
    description: 'Envie as mídias originais para liberar a seleção.',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  em_selecao: {
    label: 'Em seleção',
    description: 'O cliente pode escolher as fotos e vídeos pelo link.',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  selecao_enviada: {
    label: 'Seleção enviada',
    description: 'Seleção recebida. Verifique extras e inicie a edição.',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  em_edicao: {
    label: 'Em edição',
    description: 'A equipe está editando as mídias selecionadas.',
    badge: 'bg-purple-50 text-purple-700 ring-purple-200',
    dot: 'bg-purple-500',
  },
  pronta_entrega: {
    label: 'Pronta para entrega',
    description: 'Arquivos editados enviados. Publique o link de entrega.',
    badge: 'bg-teal-50 text-teal-700 ring-teal-200',
    dot: 'bg-teal-500',
  },
  entregue: {
    label: 'Entregue',
    description: 'Link de entrega publicado para o cliente.',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelada: {
    label: 'Cancelada',
    description: 'A galeria foi cancelada.',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
}

export const GALERIA_STATUS_ORDER: GaleriaStatus[] = [
  'aguardando_upload',
  'em_selecao',
  'selecao_enviada',
  'em_edicao',
  'pronta_entrega',
  'entregue',
  'cancelada',
]

export function contarMidias(
  midias: MidiaGaleria[],
  tipo: MidiaTipo,
  status: MidiaStatus = 'original',
): number {
  return midias.filter((midia) => midia.tipo === tipo && midia.status === status).length
}
