import type { Contrato, DadosAceiteInput } from '@/domain/contracts'
import { enviarComprovante } from '@/features/contracts/api/comprovanteApi'
import { toContrato, toSolicitacao } from '@/features/contracts/api/contratosApi'
import { ApiError, http } from '@/shared/api/httpClient'
import type { UploadOptions } from '@/shared/upload/types'
import type {
  AcceptanceResult,
  ContractAcceptancePort,
  SubmitProofResult,
} from '@/integrations/acceptance/types'

type ContratoDto = Parameters<typeof toContrato>[0]
type SolicitacaoDto = Parameters<typeof toSolicitacao>[0]

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

  async accept(token, input: DadosAceiteInput): Promise<AcceptanceResult> {
    const resposta = await http.post<{
      protocolo: string
      contrato: ContratoDto
      solicitacao: SolicitacaoDto
    }>(`/public/contratos/${token}/aceite`, input)

    const contrato: Contrato = toContrato(resposta.contrato)
    return {
      protocolo: resposta.protocolo,
      contrato,
      solicitacao: toSolicitacao(resposta.solicitacao),
    }
  },

  async submitProof(
    token,
    file: File,
    options: UploadOptions = {},
  ): Promise<SubmitProofResult> {
    const resultado = await enviarComprovante(token, file, options)
    return {
      contrato: resultado.contrato,
      solicitacao: resultado.solicitacao,
    }
  },

  async cancel(contractId, linkId) {
    await http.post(`/contratos/${contractId}/links-aceite/${linkId}/cancelar`)
  },
}
