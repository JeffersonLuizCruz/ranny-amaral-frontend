import { httpAcceptanceAdapter } from './httpAdapter'

/**
 * O aceite de contratos usa o backend real.
 *
 * A interface `ContractAcceptancePort` isola as telas dos endpoints concretos.
 */
export const acceptanceAdapter = httpAcceptanceAdapter

export type {
  AcceptanceResult,
  ContractAcceptancePort,
  SubmitProofResult,
} from './types'
