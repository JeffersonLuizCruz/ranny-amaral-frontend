import { useEffect } from 'react'

import { useContractStore } from '@/features/contracts/store/contractStore'

/**
 * Mantém a aba do staff sincronizada com o backend.
 *
 * Como contratos agora são estado de servidor, ao voltar o foco para a aba
 * recarregamos a lista para refletir aceites/pagamentos feitos em outra aba ou
 * em outro dispositivo.
 */
export function useContractCrossTabSync(): void {
  useEffect(() => {
    const atualizar = () => {
      if (document.visibilityState !== 'visible') return
      void useContractStore.getState().carregarContratos().catch(() => undefined)
    }

    window.addEventListener('focus', atualizar)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      window.removeEventListener('focus', atualizar)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [])
}
