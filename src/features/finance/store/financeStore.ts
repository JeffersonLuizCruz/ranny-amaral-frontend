import { create } from 'zustand'

import {
  resumoMensal,
  type ResumoFinanceiroMensal,
} from '@/features/finance/api/financeiroApi'
import { mensagemDeErro } from '@/shared/api/errors'

interface FinanceState {
  resumo: ResumoFinanceiroMensal | null
  mesAtual: string | null
  carregando: boolean
  erro: string | null
  carregarResumo: (mes: string) => Promise<void>
  recarregar: () => Promise<void>
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  resumo: null,
  mesAtual: null,
  carregando: false,
  erro: null,

  carregarResumo: async (mes) => {
    set({ carregando: true, erro: null, mesAtual: mes })
    try {
      const resumo = await resumoMensal(mes)
      set({ resumo })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  recarregar: async () => {
    const mes = get().mesAtual
    if (mes) await get().carregarResumo(mes)
  },
}))
