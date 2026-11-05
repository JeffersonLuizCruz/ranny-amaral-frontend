import type { PaymentProofStoragePort } from './types'

/**
 * Implementação futura para upload em backend/storage.
 * Endpoint sugerido: POST /api/contracts/:id/payment-proof
 */
export const httpProofStorage: PaymentProofStoragePort = {
  mode: 'remote',
  save: async () => {
    throw new Error('Upload de comprovante no backend ainda não configurado.')
  },
  get: async () => {
    throw new Error('Download de comprovante no backend ainda não configurado.')
  },
  remove: async () => {
    throw new Error('Remoção de comprovante no backend ainda não configurada.')
  },
}
