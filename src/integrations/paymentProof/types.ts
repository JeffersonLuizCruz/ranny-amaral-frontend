import type { ComprovantePagamento } from '@/domain/payments'

export interface PaymentProofStoragePort {
  readonly mode: 'local' | 'remote'
  save(file: File): Promise<ComprovantePagamento>
  get(key: string): Promise<Blob | null>
  remove(key: string): Promise<void>
}
