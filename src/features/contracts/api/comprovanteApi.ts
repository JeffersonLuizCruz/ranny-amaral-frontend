import type { SolicitacaoAceite } from '@/domain/contracts'
import type { Contrato } from '@/domain/contracts'
import { toContrato, toSolicitacao } from '@/features/contracts/api/contratosApi'
import { http } from '@/shared/api/httpClient'
import { sha256File } from '@/shared/upload/sha256'
import type { UploadOptions, UploadSession, UploadedPart } from '@/shared/upload/types'
import { enviarArquivo } from '@/shared/upload/uploadClient'

type ContratoDto = Parameters<typeof toContrato>[0]
type SolicitacaoDto = Parameters<typeof toSolicitacao>[0]

interface ComprovanteUploadResponse {
  contrato: ContratoDto
  solicitacao: SolicitacaoDto
}

export interface ComprovanteUploadResult {
  contrato: Contrato
  solicitacao: SolicitacaoAceite
}

/**
 * Fluxo de upload do comprovante:
 * 1. calcula SHA-256 para deduplicacao;
 * 2. inicia a sessao e recebe URLs pre-assinadas;
 * 3. envia os bytes direto ao storage, com progresso;
 * 4. conclui no backend, que valida e vincula ao contrato.
 */
export async function enviarComprovante(
  token: string,
  file: File,
  options: UploadOptions = {},
): Promise<ComprovanteUploadResult> {
  const total = file.size
  options.onProgress?.({
    fase: 'preparando',
    enviado: 0,
    total,
    percentual: 0,
    velocidadeBps: 0,
  })

  const checksumSha256 = await sha256File(file)
  const sessao = await http.post<UploadSession>(
    `/public/contratos/${token}/comprovante/upload`,
    {
      nomeArquivo: file.name,
      mimeType: file.type,
      tamanho: file.size,
      checksumSha256,
    },
  )

  let partes: UploadedPart[] = []
  try {
    partes = await enviarArquivo(file, sessao, options)
  } catch (error) {
    await http
      .post(`/public/contratos/${token}/comprovante/upload/${sessao.arquivoId}/abort`)
      .catch(() => undefined)
    throw error
  }

  options.onProgress?.({
    fase: 'concluindo',
    enviado: total,
    total,
    percentual: 100,
    velocidadeBps: 0,
  })

  const resposta = await http.post<ComprovanteUploadResponse>(
    `/public/contratos/${token}/comprovante/upload/${sessao.arquivoId}/complete`,
    { partes },
  )

  return {
    contrato: toContrato(resposta.contrato),
    solicitacao: toSolicitacao(resposta.solicitacao),
  }
}
