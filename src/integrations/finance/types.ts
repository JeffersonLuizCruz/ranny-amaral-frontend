export type DepositStatus = 'nao_solicitado' | 'pendente' | 'recebido'

export interface DepositInput {
  appointmentId: string
  amount: number
}

export interface FinancePort {
  readonly enabled: boolean
  getDepositStatus(appointmentId: string): Promise<DepositStatus | null>
  createDepositLink(input: DepositInput): Promise<string | null>
}
