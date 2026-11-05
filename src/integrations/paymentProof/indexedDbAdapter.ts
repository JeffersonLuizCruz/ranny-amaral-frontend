import type { PaymentProofStoragePort } from './types'
import {
  PAYMENT_PROOFS_STORE,
  withStore,
} from '@/integrations/storage/indexedDb'

interface ProofRecord {
  blob: Blob
  nomeArquivo: string
  mimeType: string
  tamanho: number
  enviadoEm: string
}

function createProofKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `proof-${crypto.randomUUID()}`
  }
  return `proof-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const indexedDbProofStorage: PaymentProofStoragePort = {
  mode: 'local',

  async save(file) {
    const key = createProofKey()
    const enviadoEm = new Date().toISOString()
    const record: ProofRecord = {
      blob: file,
      nomeArquivo: file.name,
      mimeType: file.type || 'application/octet-stream',
      tamanho: file.size,
      enviadoEm,
    }

    await withStore(PAYMENT_PROOFS_STORE, 'readwrite', (store) =>
      store.put(record, key),
    )

    return {
      arquivoKey: key,
      nomeArquivo: file.name,
      mimeType: record.mimeType,
      tamanho: file.size,
      enviadoEm,
    }
  },

  async get(key) {
    const record = await withStore<ProofRecord | undefined>(
      PAYMENT_PROOFS_STORE,
      'readonly',
      (store) => store.get(key),
    )
    return record?.blob ?? null
  },

  async remove(key) {
    await withStore(PAYMENT_PROOFS_STORE, 'readwrite', (store) =>
      store.delete(key),
    )
  },
}
