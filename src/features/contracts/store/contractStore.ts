import { create } from 'zustand'

import type {
  Contrato,
  ContratoAceiteStatus,
  ContratoDraft,
  ContratoPagamentoStatus,
} from '@/domain/contracts'
import type { FormaPagamentoSaldo } from '@/domain/payments'
import {
  atualizarContrato,
  cancelarContrato,
  confirmarPagamento,
  criarContrato,
  duplicarContrato,
  excluirContrato,
  isentarPagamento,
  isentarPagamentoFinal,
  listarContratos,
  listarContratosPagina,
  registrarPagamentoFinal as registrarPagamentoFinalApi,
  reabrirContrato,
  reabrirPagamentoFinal,
  rejeitarPagamento,
  buscarContrato,
} from '@/features/contracts/api/contratosApi'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { appointmentStatusFromContract } from '@/features/contracts/lib/status'
import { mensagemDeErro } from '@/shared/api/errors'
import type { Pagina } from '@/shared/api/types'

export interface FiltrosContratosPagina {
  q?: string
  statusAceite?: ContratoAceiteStatus
  statusEntrada?: ContratoPagamentoStatus
  statusSaldoFinal?: ContratoPagamentoStatus
  clienteId?: string
  agendamentoId?: string
  pagina?: number
  tamanho?: number
}

interface PagamentoFinalInput {
  valor: number
  formaPagamento: FormaPagamentoSaldo
  recebidoEm?: string
  observacoes?: string
  recebidoPor?: string
}

interface ContractState {
  contratos: Contrato[]
  paginaContratos: Pagina<Contrato> | null
  carregando: boolean
  carregandoPagina: boolean
  carregado: boolean
  erro: string | null
  carregarContratos: () => Promise<void>
  carregarPaginaContratos: (filtros?: FiltrosContratosPagina) => Promise<void>
  recarregarContrato: (id: string) => Promise<void>
  createContract: (draft: ContratoDraft) => Promise<Contrato>
  updateContract: (id: string, draft: ContratoDraft) => Promise<Contrato>
  deleteContract: (id: string) => Promise<void>
  duplicateContract: (id: string) => Promise<Contrato | null>
  reopenContract: (id: string) => Promise<void>
  cancelContract: (id: string) => Promise<void>
  confirmPayment: (id: string, confirmadoPor?: string) => Promise<void>
  rejectProof: (id: string, motivo: string) => Promise<void>
  markPaymentExempt: (id: string) => Promise<void>
  registrarPagamentoFinal: (id: string, input: PagamentoFinalInput) => Promise<void>
  marcarPagamentoFinalIsento: (id: string) => Promise<void>
  reabrirPagamentoFinal: (id: string) => Promise<void>
  /** Mantido para o botão de demonstração: recarrega do servidor. */
  recarregar: () => Promise<void>
}

function ordenar(contratos: Contrato[]): Contrato[] {
  return [...contratos].sort(
    (a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime(),
  )
}

function substituir(contratos: Contrato[], atualizado: Contrato): Contrato[] {
  return ordenar(
    contratos.map((contrato) => (contrato.id === atualizado.id ? atualizado : contrato)),
  )
}

/**
 * Espelha o estado comercial do contrato no store da agenda.
 *
 * A persistência oficial do vínculo é feita pelo backend via evento. Este
 * espelhamento local mantém a UI imediatamente consistente, sem esperar o
 * próximo carregamento.
 */
function sincronizarAgendamento(contrato: Contrato): void {
  if (!contrato.agendamentoId) return

  useAppointmentStore.getState().aplicarVinculos([
    {
      contratoId: contrato.id,
      agendamentoId: contrato.agendamentoId,
      clienteId: contrato.clienteId,
      status: appointmentStatusFromContract(contrato),
      pagamentoEntrada: contrato.pagamento,
      pagamentoFinal: contrato.pagamentoFinal,
      statusEntrada: contrato.statusEntrada,
      statusSaldoFinal: contrato.statusSaldoFinal,
      entradaQuitada: contrato.entradaQuitada,
      saldoQuitado: contrato.saldoQuitado,
      quitado: contrato.quitado,
      valorRecebido: contrato.valorRecebido,
      valorPendente: contrato.valorPendente,
    },
  ])
}

/**
 * Store de contratos com estado de servidor.
 *
 * A interface pública usada pelas telas foi preservada (lista + ações), mas a
 * numeração, o snapshot, as cláusulas, o histórico e os pagamentos agora são
 * responsabilidade do backend. O frontend apenas reflete as respostas da API.
 */
export const useContractStore = create<ContractState>()((set, get) => ({
  contratos: [],
  paginaContratos: null,
  carregando: false,
  carregandoPagina: false,
  carregado: false,
  erro: null,

  carregarContratos: async () => {
    set({ carregando: true, erro: null })
    try {
      const contratos = await listarContratos()
      set({ contratos: ordenar(contratos), carregado: true })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  carregarPaginaContratos: async (filtros = {}) => {
    set({ carregandoPagina: true, erro: null })
    try {
      const paginaContratos = await listarContratosPagina(filtros)
      set({ paginaContratos })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregandoPagina: false })
    }
  },

  recarregarContrato: async (id) => {
    try {
      const atualizado = await buscarContrato(id)
      set((state) => ({
        contratos: state.contratos.some((contrato) => contrato.id === atualizado.id)
          ? substituir(state.contratos, atualizado)
          : ordenar([...state.contratos, atualizado]),
        erro: null,
      }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  createContract: async (draft) => {
    try {
      const criado = await criarContrato(draft)
      set((state) => ({ contratos: ordenar([...state.contratos, criado]), erro: null }))
      sincronizarAgendamento(criado)
      return criado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  updateContract: async (id, draft) => {
    try {
      const atualizado = await atualizarContrato(id, draft)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
      return atualizado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  deleteContract: async (id) => {
    try {
      await excluirContrato(id)
      set((state) => ({
        contratos: state.contratos.filter((contrato) => contrato.id !== id),
        erro: null,
      }))
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  duplicateContract: async (id) => {
    try {
      const duplicado = await duplicarContrato(id)
      set((state) => ({ contratos: ordenar([...state.contratos, duplicado]), erro: null }))
      sincronizarAgendamento(duplicado)
      return duplicado
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  reopenContract: async (id) => {
    try {
      const atualizado = await reabrirContrato(id)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  cancelContract: async (id) => {
    try {
      const atualizado = await cancelarContrato(id)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  confirmPayment: async (id, confirmadoPor) => {
    try {
      const atualizado = await confirmarPagamento(id, confirmadoPor)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  rejectProof: async (id, motivo) => {
    try {
      const atualizado = await rejeitarPagamento(id, motivo)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  markPaymentExempt: async (id) => {
    try {
      const atualizado = await isentarPagamento(id)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  registrarPagamentoFinal: async (id, input) => {
    try {
      const atualizado = await registrarPagamentoFinalApi(id, input)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  marcarPagamentoFinalIsento: async (id) => {
    try {
      const atualizado = await isentarPagamentoFinal(id)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  reabrirPagamentoFinal: async (id) => {
    try {
      const atualizado = await reabrirPagamentoFinal(id)
      set((state) => ({ contratos: substituir(state.contratos, atualizado), erro: null }))
      sincronizarAgendamento(atualizado)
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  recarregar: async () => {
    await get().carregarContratos()
  },
}))
