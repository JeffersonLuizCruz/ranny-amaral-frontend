import { create } from 'zustand'

import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import {
  alternarPacoteAtivo,
  atualizarPacote,
  criarPacote,
  excluirPacote,
  listarPacotes,
  listarPacotesPagina,
} from '@/features/packages/api/pacotesApi'
import { mensagemDeErro } from '@/shared/api/errors'
import type { Pagina } from '@/shared/api/types'

export interface FiltrosPacotesPagina {
  q?: string
  ativo?: boolean
  pagina?: number
  tamanho?: number
}

interface PackageState {
  pacotes: PacoteFotografico[]
  paginaPacotes: Pagina<PacoteFotografico> | null
  carregando: boolean
  carregandoPagina: boolean
  carregado: boolean
  erro: string | null
  carregarPacotes: () => Promise<void>
  carregarPaginaPacotes: (filtros?: FiltrosPacotesPagina) => Promise<void>
  createPackage: (draft: PacoteDraft) => Promise<PacoteFotografico>
  updatePackage: (id: string, draft: PacoteDraft) => Promise<void>
  deletePackage: (id: string) => Promise<void>
  togglePackageActive: (id: string) => Promise<void>
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  restoreDemoData: () => Promise<void>
}

function ordenar(pacotes: PacoteFotografico[]): PacoteFotografico[] {
  return [...pacotes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/**
 * Store de pacotes com estado de servidor.
 *
 * A interface pública foi preservada para os consumidores existentes
 * (`booking`, galerias, agenda), mas a persistência local foi removida: o
 * catálogo agora é carregado e alterado via API.
 */
export const usePackageStore = create<PackageState>()((set, get) => ({
  pacotes: [],
  paginaPacotes: null,
  carregando: false,
  carregandoPagina: false,
  carregado: false,
  erro: null,

  carregarPacotes: async () => {
    set({ carregando: true, erro: null })
    try {
      const pacotes = await listarPacotes()
      set({ pacotes: ordenar(pacotes), carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  carregarPaginaPacotes: async (filtros = {}) => {
    set({ carregandoPagina: true, erro: null })
    try {
      const paginaPacotes = await listarPacotesPagina(filtros)
      set({ paginaPacotes })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregandoPagina: false })
    }
  },

  createPackage: async (draft) => {
    try {
      const pacote = await criarPacote(draft)
      set((state) => ({ pacotes: ordenar([...state.pacotes, pacote]), erro: null }))
      return pacote
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updatePackage: async (id, draft) => {
    try {
      const atualizado = await atualizarPacote(id, draft)
      set((state) => ({
        pacotes: ordenar(
          state.pacotes.map((pacote) => (pacote.id === id ? atualizado : pacote)),
        ),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  deletePackage: async (id) => {
    try {
      await excluirPacote(id)
      set((state) => ({
        pacotes: state.pacotes.filter((pacote) => pacote.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  togglePackageActive: async (id) => {
    try {
      const atualizado = await alternarPacoteAtivo(id)
      set((state) => ({
        pacotes: ordenar(
          state.pacotes.map((pacote) => (pacote.id === id ? atualizado : pacote)),
        ),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  restoreDemoData: async () => {
    await get().carregarPacotes()
  },
}))
