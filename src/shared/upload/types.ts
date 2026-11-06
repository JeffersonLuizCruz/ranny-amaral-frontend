export type UploadPhase =
  | 'preparando'
  | 'enviando'
  | 'concluindo'
  | 'concluido'
  | 'erro'
  | 'cancelado'

export type UploadStrategy = 'PUT' | 'MULTIPART' | 'REUTILIZADO'

export interface UploadPartUrl {
  partNumber: number
  url: string
}

export interface UploadSession {
  arquivoId: string
  uploadId: string | null
  reutilizado: boolean
  estrategia: UploadStrategy
  tamanho: number
  partSize: number
  partes: UploadPartUrl[]
  expiraEm: string | null
}

export interface UploadedPart {
  partNumber: number
  etag: string
}

export interface UploadProgress {
  fase: UploadPhase
  enviado: number
  total: number
  percentual: number
  velocidadeBps: number
  restanteSegundos?: number
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
}
