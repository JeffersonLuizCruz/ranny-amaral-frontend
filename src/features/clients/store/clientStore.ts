import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createSeedData } from '@/domain/seed'
import type { Cliente, ClienteDraft } from '@/domain/types'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.clients.v2'

interface ClientState {
  clientes: Cliente[]
  createClient: (draft: ClienteDraft) => Cliente
  updateClient: (id: string, draft: ClienteDraft) => void
  deleteClient: (id: string) => void
  restoreDemoData: () => void
}

const seed = createSeedData()

export const useClientStore = create<ClientState>()(
  persist(
    (setState) => ({
      clientes: seed.clients,

      createClient: (draft) => {
        const timestamp = new Date().toISOString()
        const cliente: Cliente = {
          ...draft,
          id: createId('cli'),
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        setState((state) => ({ clientes: [...state.clientes, cliente] }))
        return cliente
      },

      updateClient: (id, draft) => {
        setState((state) => ({
          clientes: state.clientes.map((cliente) =>
            cliente.id === id
              ? { ...cliente, ...draft, updatedAt: new Date().toISOString() }
              : cliente,
          ),
        }))
      },

      deleteClient: (id) => {
        setState((state) => ({
          clientes: state.clientes.filter((cliente) => cliente.id !== id),
        }))
      },

      restoreDemoData: () => {
        setState({ clientes: createSeedData().clients })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({ clientes: state.clientes }),
    },
  ),
)
