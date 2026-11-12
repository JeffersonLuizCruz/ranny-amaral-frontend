import type { MidiaGaleria, PedidoExtras } from '@/domain/galleries'
import { toExtras, type ExtrasDto } from '@/features/galleries/api/galeriasApi'
import { toMidia, type MidiaDto } from '@/features/galleries/api/midiaMapper'
import { http } from '@/shared/api/httpClient'
import { sha256File } from '@/shared/upload/sha256'
import type { UploadOptions, UploadSession, UploadedPart } from '@/shared/upload/types'
import { enviarArquivo } from '@/shared/upload/uploadClient'

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

export async function iniciarUploadEditada(
  galeriaId: string,
  midiaId: string,
  file: File,
  liberarAutomaticamente = true,
): Promise<UploadSession> {
  const checksumSha256 = await sha256File(file)
  return http.post<UploadSession>(
    `/galerias/${galeriaId}/midias/${midiaId}/editada/upload`,
    {
      nomeArquivo: file.name,
      mimeType: file.type,
      tamanho: file.size,
      checksumSha256,
      liberarAutomaticamente,
    },
  )
}

export async function concluirUploadEditada(
  galeriaId: string,
  midiaId: string,
  arquivoId: string,
  partes: UploadedPart[],
): Promise<MidiaGaleria> {
  const dto = await http.post<MidiaDto>(
    `/galerias/${galeriaId}/midias/${midiaId}/editada/upload/${arquivoId}/complete`,
    { partes },
  )
  return toMidia(dto)
}

export async function abortarUploadEditada(
  galeriaId: string,
  midiaId: string,
  arquivoId: string,
): Promise<void> {
  await http.post(
    `/galerias/${galeriaId}/midias/${midiaId}/editada/upload/${arquivoId}/abort`,
  )
}

export async function enviarVersaoEditada(
  galeriaId: string,
  midiaId: string,
  file: File,
  options: UploadOptions = {},
  liberarAutomaticamente = true,
): Promise<MidiaGaleria> {
  options.onProgress?.({
    fase: 'preparando',
    enviado: 0,
    total: file.size,
    percentual: 0,
    velocidadeBps: 0,
  })

  const sessao = await iniciarUploadEditada(
    galeriaId,
    midiaId,
    file,
    liberarAutomaticamente,
  )
  let partes: UploadedPart[] = []
  try {
    partes = await enviarArquivo(file, sessao, options)
  } catch (error) {
    await abortarUploadEditada(galeriaId, midiaId, sessao.arquivoId).catch(() => undefined)
    throw error
  }

  options.onProgress?.({
    fase: 'concluindo',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })

  const midia = await concluirUploadEditada(galeriaId, midiaId, sessao.arquivoId, partes)
  options.onProgress?.({
    fase: 'concluido',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })
  return midia
}

export async function removerVersaoEditada(
  galeriaId: string,
  midiaId: string,
): Promise<void> {
  await http.delete(`/galerias/${galeriaId}/midias/${midiaId}/editada`)
}

export async function iniciarComprovanteExtras(
  token: string,
  file: File,
): Promise<UploadSession> {
  const checksumSha256 = await sha256File(file)
  return http.post<UploadSession>(
    `/public/galerias/${token}/extras/comprovante/upload`,
    {
      nomeArquivo: file.name,
      mimeType: file.type,
      tamanho: file.size,
      checksumSha256,
    },
  )
}

export async function concluirComprovanteExtras(
  token: string,
  arquivoId: string,
  partes: UploadedPart[],
): Promise<PedidoExtras> {
  const dto = await http.post<ExtrasDto>(
    `/public/galerias/${token}/extras/comprovante/upload/${arquivoId}/complete`,
    { partes },
  )
  const extras = toExtras(dto)
  if (!extras) throw new Error('Resposta inválida ao concluir o comprovante.')
  return extras
}

export async function abortarComprovanteExtras(
  token: string,
  arquivoId: string,
): Promise<void> {
  await http.post(
    `/public/galerias/${token}/extras/comprovante/upload/${arquivoId}/abort`,
  )
}

export async function enviarComprovanteExtras(
  token: string,
  file: File,
  options: UploadOptions = {},
): Promise<PedidoExtras> {
  options.onProgress?.({
    fase: 'preparando',
    enviado: 0,
    total: file.size,
    percentual: 0,
    velocidadeBps: 0,
  })

  const sessao = await iniciarComprovanteExtras(token, file)
  let partes: UploadedPart[] = []
  try {
    partes = await enviarArquivo(file, sessao, options)
  } catch (error) {
    await abortarComprovanteExtras(token, sessao.arquivoId).catch(() => undefined)
    throw error
  }

  options.onProgress?.({
    fase: 'concluindo',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })

  const extras = await concluirComprovanteExtras(token, sessao.arquivoId, partes)
  options.onProgress?.({
    fase: 'concluido',
    enviado: file.size,
    total: file.size,
    percentual: 100,
    velocidadeBps: 0,
  })
  return extras
}
