import { http } from '@/shared/api/httpClient'

export type AlertaArmazenamento = 'OK' | 'ATENCAO' | 'CRITICO' | 'INDISPONIVEL'

export interface TotaisArmazenamento {
  originaisBytes: number
  editadasBytes: number
  derivadosBytes: number
  videosBytes: number
  comprovantesBytes: number
  totalBytes: number
  quantidade: number
}

export interface ResumoArmazenamento {
  coletadoEm: string
  origemColeta: 'FILESYSTEM' | 'INDISPONIVEL'
  totalBytes: number | null
  livreBytes: number | null
  usadoBytes: number | null
  crmBytes: number | null
  objetosBytes: number | null
  postgresBytes: number | null
  outrosBytes: number | null
  reservaBytes: number
  disponivelParaFotosBytes: number | null
  percentualUsado: number | null
  alerta: AlertaArmazenamento
  diasRestantesEstimados: number | null
  galeriasElegiveis: number
  totais: TotaisArmazenamento
}

export interface GaleriaArmazenamento {
  galeriaId: string
  clienteNome: string | null
  status: string
  totalBytes: number
  quantidadeArquivos: number
  entregueEm: string | null
  zipBaixadoEm: string | null
  zipConcluidoEm: string | null
  expurgoStatus: string
  expurgoEfetivadoEm: string | null
  bytesExpurgados: number
  elegivel: boolean
  motivoBloqueio: string | null
}

export interface ReconciliacaoArmazenamento {
  objetosStorage: number
  objetosCatalogo: number
  somenteStorage: number
  somenteCatalogo: number
  bytesSomenteStorage: number
  amostraSomenteStorage: string[]
  amostraSomenteCatalogo: string[]
}

export interface GrupoFinalidadeArmazenamento {
  finalidade: string
  bytes: number
  quantidade: number
}

export interface DetalheArmazenamentoGaleria {
  galeriaId: string
  clienteNome: string | null
  status: string
  totalBytes: number
  quantidadeArquivos: number
  grupos: GrupoFinalidadeArmazenamento[]
  elegivel: boolean
  motivoBloqueio: string | null
  entregueEm: string | null
  zipBaixadoEm: string | null
  zipConcluidoEm: string | null
  expurgoStatus: string
  expurgoSolicitadoEm: string | null
  expurgoSolicitadoPor: string | null
  expurgoMotivo: string | null
  expurgoEfetivadoEm: string | null
  bytesExpurgados: number
  confirmacaoEsperada: string
}

export async function obterResumoArmazenamento(): Promise<ResumoArmazenamento> {
  return http.get<ResumoArmazenamento>('/armazenamento')
}

export async function listarGaleriasArmazenamento(): Promise<GaleriaArmazenamento[]> {
  return http.get<GaleriaArmazenamento[]>('/armazenamento/galerias')
}

export async function coletarArmazenamento(): Promise<ResumoArmazenamento> {
  return http.post<ResumoArmazenamento>('/armazenamento/coletar')
}

export async function reconciliarArmazenamento(): Promise<ReconciliacaoArmazenamento> {
  return http.post<ReconciliacaoArmazenamento>('/armazenamento/reconciliar')
}

export function detalharArmazenamentoGaleria(
  galeriaId: string,
): Promise<DetalheArmazenamentoGaleria> {
  return http.get<DetalheArmazenamentoGaleria>(`/galerias/${galeriaId}/armazenamento`)
}

export async function solicitarExpurgo(
  galeriaId: string,
  motivo: string,
  confirmacao: string,
): Promise<void> {
  await http.post(`/galerias/${galeriaId}/expurgo`, { motivo, confirmacao })
}

export async function cancelarExpurgo(galeriaId: string): Promise<void> {
  await http.delete(`/galerias/${galeriaId}/expurgo`)
}
