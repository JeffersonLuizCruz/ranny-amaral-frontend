import type { Contrato, DadosAceiteInput } from '@/domain/contracts'
import type { ComprovantePagamento } from '@/domain/payments'
import { toContrato, toSolicitacao } from '@/features/contracts/api/contratosApi'
import { ApiError, http } from '@/shared/api/httpClient'
import type {
  AcceptanceResult,
  ContractAcceptancePort,
  SubmitProofResult,
} from '@/integrations/acceptance/types'

type ContratoDto = Parameters<typeof toContrato>[0]
type SolicitacaoDto = Parameters<typeof toSolicitacao>[0]

function comprovantePayload(comprovante: ComprovantePagamento) {
  return {
    arquivoKey: comprovante.arquivoKey,
    nomeArquivo: comprovante.nomeArquivo,
    mimeType: comprovante.mimeType,
    tamanho: comprovante.tamanho,
  }
}

/**
 * Adapter HTTP do aceite público.
 *
 * Toda a regra (protocolo, hash, criação do cliente, expiração e estados) fica
 * no backend. O frontend apenas transporta o token e exibe o resultado.
 */
export const httpAcceptanceAdapter: ContractAcceptancePort = {
  mode: 'remote',

  async createLink(contractId, expiresInDays) {
    const dto = await http.post<SolicitacaoDto>(
      `/contratos/${contractId}/links-aceite`,
      { expiresInDays },
    )
    return toSolicitacao(dto)
  },

  async getByToken(token) {
    try {
      const resposta = await http.get<{ solicitacao: SolicitacaoDto; contrato: ContratoDto }>(
        `/public/contratos/${token}`,
      )
      return {
        solicitacao: toSolicitacao(resposta.solicitacao),
        contrato: toContrato(resposta.contrato),
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  async markViewed(token) {
    await http.post(`/public/contratos/${token}/visualizar`)
  },

  async accept(
    token,
    input: DadosAceiteInput,
    comprovante?: ComprovantePagamento,
  ): Promise<AcceptanceResult> {
    const resposta = await http.post<{
      protocolo: string
      contrato: ContratoDto
      solicitacao: SolicitacaoDto
    }>(`/public/contratos/${token}/aceite`, {
      ...input,
      comprovante: comprovante ? comprovantePayload(comprovante) : null,
    })

    const contrato: Contrato = toContrato(resposta.contrato)
    return {
      protocolo: resposta.protocolo,
      contrato,
      solicitacao: toSolicitacao(resposta.solicitacao),
    }
  },

  async submitProof(token, comprovante): Promise<SubmitProofResult> {
    const resposta = await http.post<{
      contrato: ContratoDto
      solicitacao: SolicitacaoDto
    }>(`/public/contratos/${token}/comprovante`, comprovantePayload(comprovante))

    return {
      contrato: toContrato(resposta.contrato),
      solicitacao: toSolicitacao(resposta.solicitacao),
    }
  },

  async cancel(contractId, linkId) {
    await http.post(`/contratos/${contractId}/links-aceite/${linkId}/cancelar`)
  },
}
