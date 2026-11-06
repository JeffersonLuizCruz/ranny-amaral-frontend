import { create } from 'zustand'

import type { Cliente, ClienteDraft } from '@/domain/types'
import {
  atualizarCliente,
  criarCliente,
  excluirCliente,
  listarClientes,
  listarClientesPagina,
} from '@/features/clients/api/clientesApi'
import { mensagemDeErro } from '@/shared/api/errors'
import type { Pagina } from '@/shared/api/types'

export interface FiltrosClientesPagina {
  q?: string
  pagina?: number
  tamanho?: number
}

interface ClientState {
  clientes: Cliente[]
  paginaClientes: Pagina<Cliente> | null
  carregando: boolean
  carregandoPagina: boolean
  carregado: boolean
  erro: string | null
  carregarClientes: () => Promise<void>
  carregarPaginaClientes: (filtros?: FiltrosClientesPagina) => Promise<void>
  createClient: (draft: ClienteDraft) => Promise<Cliente>
  updateClient: (id: string, draft: ClienteDraft) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  restoreDemoData: () => Promise<void>
}

function ordenar(clientes: Cliente[]): Cliente[] {
  return [...clientes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/**
 * Store de clientes com estado de servidor.
 *
 * A interface pública (lista + ações) foi mantida para não quebrar as telas de
 * agenda, contratos e galerias, mas os dados agora vêm da API e não são mais
 * persistidos em localStorage. O backend é a fonte de verdade.
 */
export const useClientStore = create<ClientState>()((set, get) => ({
  clientes: [],
  paginaClientes: null,
  carregando: false,
  carregandoPagina: false,
  carregado: false,
  erro: null,

  carregarClientes: async () => {
    set({ carregando: true, erro: null })
    try {
      const clientes = await listarClientes()
      set({ clientes: ordenar(clientes), carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  carregarPaginaClientes: async (filtros = {}) => {
    set({ carregandoPagina: true, erro: null })
    try {
      const paginaClientes = await listarClientesPagina(filtros)
      set({ paginaClientes })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregandoPagina: false })
    }
  },

  createClient: async (draft) => {
    try {
      const cliente = await criarCliente(draft)
      set((state) => ({ clientes: ordenar([...state.clientes, cliente]), erro: null }))
      return cliente
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updateClient: async (id, draft) => {
    try {
      const atualizado = await atualizarCliente(id, draft)
      set((state) => ({
        clientes: ordenar(
          state.clientes.map((cliente) => (cliente.id === id ? atualizado : cliente)),
        ),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  deleteClient: async (id) => {
    try {
      await excluirCliente(id)
      set((state) => ({
        clientes: state.clientes.filter((cliente) => cliente.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  restoreDemoData: async () => {
    await get().carregarClientes()
  },
}))
