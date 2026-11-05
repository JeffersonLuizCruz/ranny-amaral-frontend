export interface WhatsAppReminderPort {
  readonly enabled: boolean
  schedule(appointmentId: string, when: Date): Promise<void>
  sendNow(appointmentId: string): Promise<void>
}
