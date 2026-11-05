import { useMemo } from 'react'

import type { Cliente, PacoteFotografico } from '@/domain/types'
import { useClientStore } from '@/features/clients/store/clientStore'
import { usePackageStore } from '@/features/packages/store/packageStore'

export interface CrmLookups {
  pacotesById: Map<string, PacoteFotografico>
  clientesById: Map<string, Cliente>
}

export function useCrmLookups(): CrmLookups {
  const pacotes = usePackageStore((state) => state.pacotes)
  const clientes = useClientStore((state) => state.clientes)

  return useMemo(
    () => ({
      pacotesById: new Map(pacotes.map((pacote) => [pacote.id, pacote])),
      clientesById: new Map(clientes.map((cliente) => [cliente.id, cliente])),
    }),
    [clientes, pacotes],
  )
}
