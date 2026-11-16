import { create } from 'zustand'

import type { BloqueioAgenda, BloqueioAgendaDraft } from '@/domain/types'
import { mensagemDeErro } from '@/shared/api/errors'
import {
  atualizarBloqueio,
  criarBloqueio,
  excluirBloqueio,
  listarBloqueios,
} from '@/features/agenda/api/bloqueiosApi'

interface Periodo {
  inicio: string
  fim: string
}

interface BloqueioState {
  bloqueios: BloqueioAgenda[]
  carregando: boolean
  carregado: boolean
  erro: string | null
  periodo: Periodo | null
  carregarBloqueios: (inicio: string, fim: string, forcar?: boolean) => Promise<void>
  criar: (draft: BloqueioAgendaDraft) => Promise<BloqueioAgenda>
  atualizar: (id: string, draft: BloqueioAgendaDraft) => Promise<BloqueioAgenda>
  excluir: (id: string) => Promise<void>
}

function ordenar(bloqueios: BloqueioAgenda[]): BloqueioAgenda[] {
  return [...bloqueios].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  )
}

/**
 * Bloqueios pontuais do período visível do calendário.
 *
 * Mantido separado do `appointmentStore`: bloqueios são indisponibilidade, não
 * ensaios, e a carga acompanha a navegação mês/semana/dia.
 */
export const useBloqueioStore = create<BloqueioState>()((set, get) => ({
  bloqueios: [],
  carregando: false,
  carregado: false,
  erro: null,
  periodo: null,

  carregarBloqueios: async (inicio, fim, forcar = false) => {
    const atual = get()
    if (
      !forcar &&
      atual.carregado &&
      atual.periodo?.inicio === inicio &&
      atual.periodo?.fim === fim
    ) {
      return
    }

    set({ carregando: true, erro: null })
    try {
      const bloqueios = await listarBloqueios(inicio, fim)
      set({
        bloqueios: ordenar(bloqueios),
        carregado: true,
        periodo: { inicio, fim },
      })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  criar: async (draft) => {
    try {
      const criado = await criarBloqueio(draft)
      set((state) => ({ bloqueios: ordenar([...state.bloqueios, criado]), erro: null }))
      return criado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  atualizar: async (id, draft) => {
    try {
      const atualizado = await atualizarBloqueio(id, draft)
      set((state) => ({
        bloqueios: ordenar(
          state.bloqueios.map((bloqueio) =>
            bloqueio.id === atualizado.id ? atualizado : bloqueio,
          ),
        ),
        erro: null,
      }))
      return atualizado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  excluir: async (id) => {
    try {
      await excluirBloqueio(id)
      set((state) => ({
        bloqueios: state.bloqueios.filter((bloqueio) => bloqueio.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },
}))
