import type { WhatsAppReminderPort } from './types'

/**
 * Ponto de integração para lembretes automáticos via WhatsApp.
 * A UI já consulta `enabled`; basta trocar a implementação no futuro.
 */
export const whatsappReminders: WhatsAppReminderPort = {
  enabled: false,
  schedule: async () => undefined,
  sendNow: async () => undefined,
}
