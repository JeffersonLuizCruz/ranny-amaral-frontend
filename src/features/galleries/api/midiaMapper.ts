import type { MidiaGaleria } from '@/domain/galleries'

export interface MidiaDto {
  id: string
  tipo: 'foto' | 'video'
  nomeOriginal: string
  mimeType: string
  tamanho: number
  largura: number | null
  altura: number | null
  duracaoSegundos: number | null
  ordem: number
  status: string
  erroProcessamento: string | null
  thumbUrl: string | null
  webUrl: string | null
  originalUrl: string | null
  editadaUrl: string | null
  createdAt: string
}

export function toMidia(dto: MidiaDto): MidiaGaleria {
  return {
    id: dto.id,
    tipo: dto.tipo,
    nomeArquivo: dto.nomeOriginal,
    mimeType: dto.mimeType,
    tamanho: dto.tamanho,
    status: dto.editadaUrl ? 'editada' : 'original',
    uploadedAt: dto.createdAt,
    thumbUrl: dto.thumbUrl ?? undefined,
    webUrl: dto.webUrl ?? undefined,
    originalUrl: dto.originalUrl ?? undefined,
    editadaUrl: dto.editadaUrl ?? undefined,
    processamentoStatus: dto.status as MidiaGaleria['processamentoStatus'],
    erroProcessamento: dto.erroProcessamento ?? undefined,
  }
}
