import type { MidiaGaleria } from '@/domain/galleries'
import { toMidia } from '@/features/galleries/api/midiaMapper'
import { http } from '@/shared/api/httpClient'
import { sha256File } from '@/shared/upload/sha256'
import type { UploadOptions, UploadSession, UploadedPart } from '@/shared/upload/types'
import { enviarArquivo } from '@/shared/upload/uploadClient'

interface MidiaDto {
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

export async function iniciarUploadMidia(
  galeriaId: string,
  file: File,
  tipo: 'foto' | 'video',
): Promise<UploadSession> {
  const checksumSha256 = await sha256File(file)
  return http.post<UploadSession>(`/galerias/${galeriaId}/midias/upload`, {
    nomeArquivo: file.name,
    mimeType: file.type,
    tamanho: file.size,
    checksumSha256,
    tipo,
  })
}

export async function concluirUploadMidia(
  galeriaId: string,
  arquivoId: string,
  partes: UploadedPart[],
  tipo: 'foto' | 'video',
): Promise<MidiaGaleria> {
  const dto = await http.post<MidiaDto>(
    `/galerias/${galeriaId}/midias/upload/${arquivoId}/complete`,
    { partes, tipo },
  )
  return toMidia(dto)
}

export async function abortarUploadMidia(
  galeriaId: string,
  arquivoId: string,
  tipo: 'foto' | 'video',
): Promise<void> {
  await http.post(
    `/galerias/${galeriaId}/midias/upload/${arquivoId}/abort?tipo=${tipo}`,
  )
}

export async function enviarMidia(
  galeriaId: string,
  file: File,
  tipo: 'foto' | 'video',
  options: UploadOptions = {},
): Promise<MidiaGaleria> {
  options.onProgress?.({
    fase: 'preparando',
    enviado: 0,
    total: file.size,
    percentual: 0,
    velocidadeBps: 0,
  })

  const sessao = await iniciarUploadMidia(galeriaId, file, tipo)
  let partes: UploadedPart[] = []
  try {
    partes = await enviarArquivo(file, sessao, options)
  } catch (error) {
    await abortarUploadMidia(galeriaId, sessao.arquivoId, tipo).catch(() => undefined)
    throw error
  }

  options.onProgress?.({
    fase: 'concluindo',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })

  const midia = await concluirUploadMidia(galeriaId, sessao.arquivoId, partes, tipo)
  options.onProgress?.({
    fase: 'concluido',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })
  return midia
}
