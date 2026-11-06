import { create } from 'zustand'

import type { ModeloContrato, ModeloContratoDraft } from '@/domain/contracts'
import {
  alternarModeloAtivo,
  atualizarModelo,
  criarModelo,
  duplicarModelo,
  excluirModelo,
  listarModelos,
} from '@/features/contracts/api/modelosApi'
import { mensagemDeErro } from '@/shared/api/errors'

interface TemplateState {
  modelos: ModeloContrato[]
  carregando: boolean
  carregado: boolean
  erro: string | null
  carregarModelos: () => Promise<void>
  createTemplate: (draft: ModeloContratoDraft) => Promise<ModeloContrato>
  updateTemplate: (id: string, draft: ModeloContratoDraft) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<ModeloContrato>
  toggleTemplateActive: (id: string) => Promise<void>
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  restoreDemoData: () => Promise<void>
}

function ordenar(modelos: ModeloContrato[]): ModeloContrato[] {
  return [...modelos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Store de modelos de contrato com estado de servidor. */
export const useTemplateStore = create<TemplateState>()((set, get) => ({
  modelos: [],
  carregando: false,
  carregado: false,
  erro: null,

  carregarModelos: async () => {
    set({ carregando: true, erro: null })
    try {
      const modelos = await listarModelos()
      set({ modelos: ordenar(modelos), carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  createTemplate: async (draft) => {
    try {
      const criado = await criarModelo(draft)
      set((state) => ({ modelos: ordenar([...state.modelos, criado]), erro: null }))
      return criado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updateTemplate: async (id, draft) => {
    try {
      const atualizado = await atualizarModelo(id, draft)
      set((state) => ({
        modelos: ordenar(
          state.modelos.map((modelo) => (modelo.id === id ? atualizado : modelo)),
        ),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  deleteTemplate: async (id) => {
    try {
      await excluirModelo(id)
      set((state) => ({
        modelos: state.modelos.filter((modelo) => modelo.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  duplicateTemplate: async (id) => {
    try {
      const duplicado = await duplicarModelo(id)
      set((state) => ({ modelos: ordenar([...state.modelos, duplicado]), erro: null }))
      return duplicado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  toggleTemplateActive: async (id) => {
    try {
      const atualizado = await alternarModeloAtivo(id)
      set((state) => ({
        modelos: ordenar(
          state.modelos.map((modelo) => (modelo.id === id ? atualizado : modelo)),
        ),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  restoreDemoData: async () => {
    await get().carregarModelos()
  },
}))
