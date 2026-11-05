import type {
  Contrato,
  DadosAceiteInput,
  SolicitacaoAceite,
} from '@/domain/contracts'
import type { ComprovantePagamento } from '@/domain/payments'

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
  accept(
    token: string,
    input: DadosAceiteInput,
    comprovante?: ComprovantePagamento,
  ): Promise<AcceptanceResult>
  submitProof(
    token: string,
    comprovante: ComprovantePagamento,
  ): Promise<SubmitProofResult>
  cancel(linkId: string): Promise<void>
}
