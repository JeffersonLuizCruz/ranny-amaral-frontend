import type {
  Contrato,
  DadosAceiteInput,
  SolicitacaoAceite,
} from '@/domain/contracts'
import type { UploadOptions } from '@/shared/upload/types'

export interface AcceptanceResult {
  protocolo: string
  contrato: Contrato
  solicitacao: SolicitacaoAceite
}

export interface SubmitProofResult {
  contrato: Contrato
  solicitacao: SolicitacaoAceite
}

export interface ContractAcceptancePort {
  readonly mode: 'local' | 'remote'
  createLink(contractId: string, expiresInDays: number): Promise<SolicitacaoAceite>
  getByToken(
    token: string,
  ): Promise<{ solicitacao: SolicitacaoAceite; contrato: Contrato } | null>
  markViewed(token: string): Promise<void>
  accept(token: string, input: DadosAceiteInput): Promise<AcceptanceResult>
  submitProof(
    token: string,
    file: File,
    options?: UploadOptions,
  ): Promise<SubmitProofResult>
  cancel(contractId: string, linkId: string): Promise<void>
}
