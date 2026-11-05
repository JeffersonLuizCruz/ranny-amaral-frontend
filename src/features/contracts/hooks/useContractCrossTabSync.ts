import { useEffect } from 'react'

import { useAcceptanceStore } from '@/features/contracts/store/acceptanceStore'
import { useContractStore } from '@/features/contracts/store/contractStore'

/**
 * Mantém a aba do staff sincronizada quando o cliente aceita o contrato
 * em outra aba do mesmo navegador (modo local).
 */
export function useContractCrossTabSync(): void {
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (
        event.key.startsWith('photoizer.crm.contracts') ||
        event.key.startsWith('photoizer.crm.acceptance')
      ) {
        void useContractStore.persist.rehydrate()
        void useAcceptanceStore.persist.rehydrate()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
}
