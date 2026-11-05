import { indexedDbProofStorage } from './indexedDbAdapter'

/**
 * Troque por httpProofStorage quando o backend Java estiver disponível.
 */
export const paymentProofStorage = indexedDbProofStorage

export type { PaymentProofStoragePort } from './types'
