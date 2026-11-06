import { create } from 'zustand'

import type {
  AgendamentoDraft,
  AgendamentoEnsaio,
  AgendamentoStatus,
} from '@/domain/types'
import type { PagamentoEntrada, PagamentoSaldo, PagamentoStatus } from '@/domain/payments'
import {
  alterarStatusAgendamento,
  atualizarAgendamento,
  atualizarPagamentoEntrada,
  atualizarPagamentoFinal,
  criarAgendamento,
  excluirAgendamento,
  listarAgendamentos,
} from '@/features/appointments/api/agendaApi'
import { mensagemDeErro } from '@/shared/api/errors'

/**
 * Vínculo vindo do contrato local (transição).
 *
 * Enquanto o módulo de contratos ainda vive no navegador, o backend não conhece
 * `contratoId`, `clienteId` nem os pagamentos espelhados. No boot, o app
 * reconcilia esse vínculo nos agendamentos recém-carregados da API.
 */
export interface VinculoContrato {
  contratoId: string
  agendamentoId: string
  clienteId?: string
  status: AgendamentoStatus
  pagamentoEntrada?: PagamentoEntrada
  pagamentoFinal?: PagamentoSaldo
}

interface AppointmentState {
  appointments: AgendamentoEnsaio[]
  carregando: boolean
  carregado: boolean
  erro: string | null
  carregarAgendamentos: () => Promise<void>
  createAppointment: (draft: AgendamentoDraft) => Promise<AgendamentoEnsaio>
  updateAppointment: (id: string, draft: AgendamentoDraft) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  updateStatus: (id: string, status: AgendamentoStatus) => Promise<void>
  setDepositStatus: (id: string, status: PagamentoStatus) => Promise<void>
  setPaymentEntrada: (id: string, pagamento: PagamentoEntrada) => Promise<void>
  setPaymentFinal: (id: string, pagamento: PagamentoSaldo) => Promise<void>
  linkContract: (id: string, contratoId: string) => void
  linkGallery: (id: string, galeriaId: string) => void
  linkClient: (id: string, clienteId: string) => void
  aplicarVinculos: (vinculos: VinculoContrato[]) => void
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  restoreDemoData: () => Promise<void>
}

function ordenar(appointments: AgendamentoEnsaio[]): AgendamentoEnsaio[] {
  return [...appointments].sort(
    (a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime(),
  )
}

function substituir(
  appointments: AgendamentoEnsaio[],
  atualizado: AgendamentoEnsaio,
): AgendamentoEnsaio[] {
  return ordenar(
    appointments.map((appointment) =>
      appointment.id === atualizado.id ? atualizado : appointment,
    ),
  )
}

function patchLocal(
  appointments: AgendamentoEnsaio[],
  id: string,
  patch: Partial<AgendamentoEnsaio>,
): AgendamentoEnsaio[] {
  return appointments.map((appointment) =>
    appointment.id === id
      ? { ...appointment, ...patch, updatedAt: new Date().toISOString() }
      : appointment,
  )
}

/**
 * Store da agenda com estado de servidor.
 *
 * Mantém a interface usada por contratos, financeiro, galerias e agenda, mas
 * agora carrega e persiste via API. Vínculos que ainda não existem no backend
 * (`contratoId`, `galeriaId`) continuam locais até a migração dos respectivos
 * módulos.
 */
export const useAppointmentStore = create<AppointmentState>()((set, get) => ({
  appointments: [],
  carregando: false,
  carregado: false,
  erro: null,

  carregarAgendamentos: async () => {
    set({ carregando: true, erro: null })
    try {
      const appointments = await listarAgendamentos()
      set({ appointments: ordenar(appointments), carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  createAppointment: async (draft) => {
    try {
      const criado = await criarAgendamento(draft)
      set((state) => ({ appointments: ordenar([...state.appointments, criado]), erro: null }))
      return criado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updateAppointment: async (id, draft) => {
    try {
      const atualizado = await atualizarAgendamento(id, draft)
      set((state) => ({ appointments: substituir(state.appointments, atualizado), erro: null }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  deleteAppointment: async (id) => {
    try {
      await excluirAgendamento(id)
      set((state) => ({
        appointments: state.appointments.filter((appointment) => appointment.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updateStatus: async (id, status) => {
    try {
      const atualizado = await alterarStatusAgendamento(id, status)
      set((state) => ({ appointments: substituir(state.appointments, atualizado), erro: null }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  setDepositStatus: async (id, status) => {
    const appointment = get().appointments.find((item) => item.id === id)
    if (!appointment) return

    try {
      const atualizado = await atualizarPagamentoEntrada(id, {
        ...appointment.pagamentoEntrada,
        status,
      })
      set((state) => ({ appointments: substituir(state.appointments, atualizado), erro: null }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  setPaymentEntrada: async (id, pagamento) => {
    try {
      const atualizado = await atualizarPagamentoEntrada(id, pagamento)
      set((state) => ({ appointments: substituir(state.appointments, atualizado), erro: null }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  setPaymentFinal: async (id, pagamento) => {
    try {
      const atualizado = await atualizarPagamentoFinal(id, pagamento)
      set((state) => ({ appointments: substituir(state.appointments, atualizado), erro: null }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  linkContract: (id, contratoId) => {
    set((state) => ({ appointments: patchLocal(state.appointments, id, { contratoId }) }))
  },

  linkGallery: (id, galeriaId) => {
    set((state) => ({ appointments: patchLocal(state.appointments, id, { galeriaId }) }))
  },

  linkClient: (id, clienteId) => {
    set((state) => ({ appointments: patchLocal(state.appointments, id, { clienteId }) }))
  },

  aplicarVinculos: (vinculos) => {
    const porAgendamento = new Map(vinculos.map((vinculo) => [vinculo.agendamentoId, vinculo]))
    set((state) => ({
      appointments: state.appointments.map((appointment) => {
        const vinculo = porAgendamento.get(appointment.id)
        if (!vinculo) return appointment
        return {
          ...appointment,
          contratoId: vinculo.contratoId,
          clienteId: vinculo.clienteId ?? appointment.clienteId,
          status:
            appointment.status === 'realizado' ? appointment.status : vinculo.status,
          pagamentoEntrada: vinculo.pagamentoEntrada ?? appointment.pagamentoEntrada,
          pagamentoFinal: vinculo.pagamentoFinal ?? appointment.pagamentoFinal,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  restoreDemoData: async () => {
    await get().carregarAgendamentos()
  },
}))
