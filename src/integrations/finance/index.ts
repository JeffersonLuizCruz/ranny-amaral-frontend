import type { FinancePort } from './types'

/**
 * Ponto de integração do módulo financeiro.
 * Quando o backend existir, substitua esta implementação por uma real.
 */
export const financeIntegration: FinancePort = {
  enabled: false,
  getDepositStatus: async () => null,
  createDepositLink: async () => null,
}
