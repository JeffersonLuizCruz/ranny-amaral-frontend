import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createContractSeedData } from '@/domain/contractSeed'
import type {
  DadosAceite,
  SolicitacaoAceite,
} from '@/domain/contracts'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.acceptance-requests.v2'

interface AcceptanceState {
  solicitacoes: SolicitacaoAceite[]
  createSolicitacao: (contratoId: string, expiresInDays: number) => SolicitacaoAceite
  markViewed: (token: string) => void
  markAccepted: (token: string, dadosAceite: DadosAceite) => void
  cancelSolicitacao: (id: string) => void
  expireSolicitacao: (id: string) => void
  restoreDemoData: () => void
}

const seed = createContractSeedData()

export const useAcceptanceStore = create<AcceptanceState>()(
  persist(
    (setState) => ({
      solicitacoes: seed.acceptanceRequests,

      createSolicitacao: (contratoId, expiresInDays) => {
        const now = new Date()
        const solicitacao: SolicitacaoAceite = {
          id: createId('req'),
          contratoId,
          token: createId('aceite'),
          status: 'pendente',
          criadaEm: now.toISOString(),
          expiraEm: new Date(now.getTime() + expiresInDays * 86_400_000).toISOString(),
        }

        setState((state) => ({ solicitacoes: [solicitacao, ...state.solicitacoes] }))
        return solicitacao
      },

      markViewed: (token) => {
        setState((state) => ({
          solicitacoes: state.solicitacoes.map((solicitacao) =>
            solicitacao.token === token && solicitacao.status === 'pendente'
              ? {
                  ...solicitacao,
                  status: 'visualizada',
                  visualizadaEm: new Date().toISOString(),
                }
              : solicitacao,
          ),
        }))
      },

      markAccepted: (token, dadosAceite) => {
        setState((state) => ({
          solicitacoes: state.solicitacoes.map((solicitacao) =>
            solicitacao.token === token
              ? {
                  ...solicitacao,
                  status: 'aceita',
                  dadosAceite,
                }
              : solicitacao,
          ),
        }))
      },

      cancelSolicitacao: (id) => {
        setState((state) => ({
          solicitacoes: state.solicitacoes.map((solicitacao) =>
            solicitacao.id === id
              ? { ...solicitacao, status: 'cancelada' }
              : solicitacao,
          ),
        }))
      },

      expireSolicitacao: (id) => {
        setState((state) => ({
          solicitacoes: state.solicitacoes.map((solicitacao) =>
            solicitacao.id === id && ['pendente', 'visualizada'].includes(solicitacao.status)
              ? { ...solicitacao, status: 'expirada' }
              : solicitacao,
          ),
        }))
      },

      restoreDemoData: () => {
        setState({ solicitacoes: createContractSeedData().acceptanceRequests })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({ solicitacoes: state.solicitacoes }),
    },
  ),
)
