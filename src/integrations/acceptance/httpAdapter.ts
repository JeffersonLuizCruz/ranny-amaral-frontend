import type { ContractAcceptancePort } from './types'

/**
 * Implementação preparada para um backend Java real.
 * Endpoints esperados:
 *  - POST /api/contracts/:id/acceptance-links
 *  - GET  /api/public/contracts/:token
 *  - POST /api/public/contracts/:token/view
 *  - POST /api/public/contracts/:token/accept
 *  - POST /api/public/contracts/:token/payment-proof
 *  - POST /api/contracts/:id/acceptance-links/:linkId/cancel
 */
export const httpAcceptanceAdapter: ContractAcceptancePort = {
  mode: 'remote',
  createLink: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
  getByToken: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
  markViewed: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
  accept: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
  submitProof: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
  cancel: async () => {
    throw new Error('Integração HTTP de aceite ainda não configurada.')
  },
}
