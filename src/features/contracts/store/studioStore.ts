import { create } from 'zustand'

import type { EstudioConfig } from '@/domain/contracts'
import { atualizarEstudio, obterEstudio } from '@/features/contracts/api/estudioApi'
import { mensagemDeErro } from '@/shared/api/errors'

export const ESTUDIO_PADRAO: EstudioConfig = {
  nome: 'Estúdio Fotográfico',
  percentualEntradaPadrao: 30,
  prazoPagamentoDias: 3,
}

interface StudioState {
  estudio: EstudioConfig
  carregando: boolean
  carregado: boolean
  erro: string | null
  carregarEstudio: () => Promise<void>
  updateEstudio: (config: EstudioConfig) => Promise<void>
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  restoreDemoData: () => Promise<void>
}

/** Store da configuração única do estúdio, servida pelo backend. */
export const useStudioStore = create<StudioState>()((set, get) => ({
  estudio: ESTUDIO_PADRAO,
  carregando: false,
  carregado: false,
  erro: null,

  carregarEstudio: async () => {
    set({ carregando: true, erro: null })
    try {
      const estudio = await obterEstudio()
      set({ estudio, carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  updateEstudio: async (config) => {
    try {
      const estudio = await atualizarEstudio(config)
      set({ estudio, erro: null })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  restoreDemoData: async () => {
    await get().carregarEstudio()
  },
}))
