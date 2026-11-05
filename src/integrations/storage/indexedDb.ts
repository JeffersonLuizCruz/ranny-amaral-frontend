export const CRM_DB_NAME = 'photoizer-crm'
export const CRM_DB_VERSION = 2

export const PAYMENT_PROOFS_STORE = 'payment-proofs'
export const GALLERY_MEDIA_STORE = 'gallery-media'

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não está disponível neste navegador.'))
      return
    }

    const request = indexedDB.open(CRM_DB_NAME, CRM_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PAYMENT_PROOFS_STORE)) {
        db.createObjectStore(PAYMENT_PROOFS_STORE)
      }
      if (!db.objectStoreNames.contains(GALLERY_MEDIA_STORE)) {
        db.createObjectStore(GALLERY_MEDIA_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Falha ao abrir IndexedDB.'))
  })

  return dbPromise
}

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Falha no IndexedDB.'))
  })
}
