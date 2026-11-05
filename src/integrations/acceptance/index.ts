import { localAcceptanceAdapter } from './localAdapter'

/**
 * Troque por `httpAcceptanceAdapter` quando o backend estiver disponível.
 * O restante do frontend depende apenas desta interface.
 */
export const acceptanceAdapter = localAcceptanceAdapter

export type {
  AcceptanceResult,
  ContractAcceptancePort,
  SubmitProofResult,
} from './types'
