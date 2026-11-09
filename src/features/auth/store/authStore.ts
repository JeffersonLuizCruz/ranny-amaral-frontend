import { create } from 'zustand'

import * as authApi from '@/features/auth/api/authApi'
import type { Sessao, Usuario } from '@/features/auth/types'
import { session } from '@/shared/api/session'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  usuario: Usuario | null
  accessToken: string | null
  status: Status
  inicializado: boolean
  login: (email: string, senha: string) => Promise<Sessao>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  refreshSession: () => Promise<boolean>
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<Sessao>
  aplicarSessao: (sessao: Sessao) => void
  limparSessao: () => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  usuario: null,
  accessToken: null,
  status: 'loading',
  inicializado: false,

  aplicarSessao: (sessao) => {
    session.setToken(sessao.accessToken)
    set({
      usuario: sessao.usuario,
      accessToken: sessao.accessToken,
      status: 'authenticated',
      inicializado: true,
    })
  },

  limparSessao: () => {
    session.setToken(null)
    set({
      usuario: null,
      accessToken: null,
      status: 'anonymous',
      inicializado: true,
    })
  },

  login: async (email, senha) => {
    const sessao = await authApi.login(email, senha)
    get().aplicarSessao(sessao)
    return sessao
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      get().limparSessao()
    }
  },

  bootstrap: async () => {
    if (get().inicializado) return
    set({ status: 'loading' })
    try {
      const sessao = await authApi.refresh()
      get().aplicarSessao(sessao)
    } catch {
      get().limparSessao()
    }
  },

  refreshSession: async () => {
    try {
      const sessao = await authApi.refresh()
      get().aplicarSessao(sessao)
      return true
    } catch {
      get().limparSessao()
      return false
    }
  },

  changePassword: async (senhaAtual, novaSenha) => {
    const sessao = await authApi.changePassword(senhaAtual, novaSenha)
    get().aplicarSessao(sessao)
    return sessao
  },
}))

session.configure({
  refresh: () => useAuthStore.getState().refreshSession(),
  unauthorized: () => useAuthStore.getState().limparSessao(),
})
