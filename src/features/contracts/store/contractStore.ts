import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createContractSeedData } from '@/domain/contractSeed'
import type {
  Contrato,
  ContratoClausula,
  ContratoDraft,
  ContratoEventoTipo,
  ContratoSnapshot,
  DadosAceite,
} from '@/domain/contracts'
import type {
  ComprovantePagamento,
  FormaPagamentoSaldo,
  PagamentoEntrada,
  PagamentoSaldo,
} from '@/domain/payments'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { nextContractNumber } from '@/features/contracts/lib/numbering'
import { appointmentStatusFromContract } from '@/features/contracts/lib/status'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.contracts.v2'

interface AcceptContractInput {
  aceite: DadosAceite
  solicitacaoId: string
  clienteId?: string
  snapshot: ContratoSnapshot
  clausulas: ContratoClausula[]
  pagamento?: PagamentoEntrada
}

interface ContractState {
  contratos: Contrato[]
  createContract: (draft: ContratoDraft) => Contrato
  updateContract: (id: string, draft: ContratoDraft) => void
  deleteContract: (id: string) => void
  duplicateContract: (id: string) => Contrato | null
  markLinkGenerated: (id: string, solicitacaoId: string) => void
  markAccepted: (id: string, input: AcceptContractInput) => void
  markExpired: (id: string) => void
  reopenContract: (id: string) => void
  cancelContract: (id: string) => void
  registerProof: (id: string, comprovante: ComprovantePagamento) => void
  confirmPayment: (id: string, confirmadoPor?: string) => void
  rejectProof: (id: string, motivo: string) => void
  markPaymentExempt: (id: string) => void
  registrarPagamentoFinal: (
    id: string,
    input: {
      valor: number
      formaPagamento: FormaPagamentoSaldo
      recebidoEm?: string
      observacoes?: string
      recebidoPor?: string
    },
  ) => void
  marcarPagamentoFinalIsento: (id: string) => void
  reabrirPagamentoFinal: (id: string) => void
  addHistory: (id: string, tipo: ContratoEventoTipo, detalhe?: string) => void
  restoreDemoData: () => void
}

const seed = createContractSeedData()

function normalizeContract(contrato: Contrato): Contrato {
  const pagamentoFinal =
    contrato.pagamentoFinal ??
    ({
      valor: contrato.saldoRestante,
      status: contrato.saldoRestante > 0 ? 'pendente' : 'isento',
    } satisfies PagamentoSaldo)

  return {
    ...contrato,
    pagamentoFinal,
    statusPagamentoFinal: contrato.statusPagamentoFinal ?? pagamentoFinal.status,
  }
}

function historyEvent(tipo: ContratoEventoTipo, detalhe?: string) {
  return {
    id: createId('evt'),
    tipo,
    em: new Date().toISOString(),
    detalhe,
  }
}

function syncAppointment(contrato: Contrato): void {
  if (!contrato.agendamentoId) return

  const appointmentStore = useAppointmentStore.getState()
  const appointment = appointmentStore.appointments.find(
    (item) => item.id === contrato.agendamentoId,
  )

  if (!appointment) return

  if (appointment.status !== 'realizado') {
    const nextStatus = appointmentStatusFromContract(contrato)
    if (appointment.status !== nextStatus) {
      appointmentStore.updateStatus(appointment.id, nextStatus)
    }
  }

  const samePayment =
    JSON.stringify(appointment.pagamentoEntrada) === JSON.stringify(contrato.pagamento)

  if (!samePayment) {
    appointmentStore.setPaymentEntrada(appointment.id, { ...contrato.pagamento })
  }

  if (
    contrato.pagamentoFinal &&
    JSON.stringify(appointment.pagamentoFinal) !==
      JSON.stringify(contrato.pagamentoFinal)
  ) {
    appointmentStore.setPaymentFinal(appointment.id, {
      ...contrato.pagamentoFinal,
    })
  }
}

export const useContractStore = create<ContractState>()(
  persist(
    (setState, getState) => ({
      contratos: seed.contracts,

      createContract: (draft) => {
        const timestamp = new Date().toISOString()
        const contrato: Contrato = normalizeContract({
          ...draft,
          id: createId('ct'),
          numero: nextContractNumber(getState().contratos),
          statusAceite: 'rascunho',
          statusPagamento: draft.pagamento.status,
          statusPagamentoFinal: draft.pagamentoFinal.status,
          historico: [historyEvent('criado', 'Contrato criado.')],
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        setState((state) => ({ contratos: [contrato, ...state.contratos] }))
        syncAppointment(contrato)
        return contrato
      },

      updateContract: (id, draft) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id || contrato.statusAceite !== 'rascunho') {
              return contrato
            }

            return {
              ...contrato,
              ...draft,
              statusPagamento: draft.pagamento.status,
              statusPagamentoFinal: draft.pagamentoFinal.status,
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('atualizado', 'Contrato atualizado.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      deleteContract: (id) => {
        setState((state) => ({
          contratos: state.contratos.filter(
            (contrato) => contrato.id !== id || contrato.statusAceite !== 'rascunho',
          ),
        }))
      },

      duplicateContract: (id) => {
        const original = getState().contratos.find((contrato) => contrato.id === id)
        if (!original) return null

        const timestamp = new Date().toISOString()
        const pagamento: PagamentoEntrada = {
          ...original.pagamento,
          status: original.pagamento.valor > 0 ? 'pendente' : 'isento',
          comprovante: undefined,
          rejeicao: undefined,
          confirmadoEm: undefined,
          confirmadoPor: undefined,
        }

        const pagamentoFinal: PagamentoSaldo = {
          valor: original.saldoRestante,
          status: original.saldoRestante > 0 ? 'pendente' : 'isento',
        }

        const duplicado: Contrato = {
          ...original,
          id: createId('ct'),
          numero: nextContractNumber(getState().contratos),
          statusAceite: 'rascunho',
          statusPagamento: pagamento.status,
          statusPagamentoFinal: pagamentoFinal.status,
          pagamento,
          pagamentoFinal,
          solicitacaoAtualId: undefined,
          aceite: undefined,
          historico: [historyEvent('duplicado', `Duplicado de ${original.numero}.`)],
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        setState((state) => ({ contratos: [duplicado, ...state.contratos] }))
        syncAppointment(duplicado)
        return duplicado
      },

      markLinkGenerated: (id, solicitacaoId) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato
            if (!['rascunho', 'expirado'].includes(contrato.statusAceite)) return contrato

            return {
              ...contrato,
              statusAceite: 'pendente',
              solicitacaoAtualId: solicitacaoId,
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('link_gerado', 'Link de aceite gerado.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      markAccepted: (id, input) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            const pagamento = input.pagamento ?? contrato.pagamento
            const statusPagamento = pagamento.status

            return {
              ...contrato,
              statusAceite: 'aceito',
              statusPagamento,
              solicitacaoAtualId: input.solicitacaoId,
              clienteId: input.clienteId ?? contrato.clienteId,
              snapshot: input.snapshot,
              clausulas: input.clausulas,
              aceite: input.aceite,
              pagamento,
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent(
                  'aceite_registrado',
                  `Aceite registrado com protocolo ${input.aceite.protocolo}.`,
                ),
                ...(input.clienteId
                  ? [historyEvent('cliente_vinculado', 'Cliente vinculado ao contrato.')]
                  : []),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      markExpired: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id || contrato.statusAceite !== 'pendente') {
              return contrato
            }

            return {
              ...contrato,
              statusAceite: 'expirado',
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('link_expirado', 'O link de aceite expirou.'),
              ],
            }
          }),
        }))
      },

      reopenContract: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato
            if (!['pendente', 'expirado'].includes(contrato.statusAceite)) {
              return contrato
            }

            return {
              ...contrato,
              statusAceite: 'rascunho',
              solicitacaoAtualId: undefined,
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('reaberto', 'Contrato reaberto como rascunho.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      cancelContract: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id || contrato.statusAceite === 'aceito') {
              return contrato
            }

            return {
              ...contrato,
              statusAceite: 'cancelado',
              statusPagamento:
                contrato.statusPagamento === 'confirmado'
                  ? 'confirmado'
                  : 'cancelado',
              statusPagamentoFinal:
                contrato.statusPagamentoFinal === 'confirmado'
                  ? 'confirmado'
                  : 'cancelado',
              pagamento: {
                ...contrato.pagamento,
                status:
                  contrato.pagamento.status === 'confirmado'
                    ? 'confirmado'
                    : 'cancelado',
              },
              pagamentoFinal: {
                ...contrato.pagamentoFinal,
                status:
                  contrato.pagamentoFinal.status === 'confirmado'
                    ? 'confirmado'
                    : 'cancelado',
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('contrato_cancelado', 'Contrato cancelado pelo estúdio.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      registerProof: (id, comprovante) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            return {
              ...contrato,
              statusPagamento: 'pendente',
              pagamento: {
                ...contrato.pagamento,
                status: 'pendente',
                comprovante,
                rejeicao: undefined,
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('comprovante_enviado', 'Comprovante de pagamento enviado.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      confirmPayment: (id, confirmadoPor = 'Equipe do estúdio') => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            return {
              ...contrato,
              statusPagamento: 'confirmado',
              pagamento: {
                ...contrato.pagamento,
                status: 'confirmado',
                confirmadoEm: new Date().toISOString(),
                confirmadoPor,
                rejeicao: undefined,
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('pagamento_confirmado', 'Entrada confirmada pelo estúdio.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      rejectProof: (id, motivo) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            return {
              ...contrato,
              statusPagamento: 'pendente',
              pagamento: {
                ...contrato.pagamento,
                status: 'pendente',
                rejeicao: {
                  motivo,
                  rejeitadoEm: new Date().toISOString(),
                },
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('pagamento_rejeitado', `Comprovante rejeitado: ${motivo}`),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      markPaymentExempt: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            return {
              ...contrato,
              statusPagamento: 'isento',
              pagamento: {
                ...contrato.pagamento,
                status: 'isento',
                comprovante: undefined,
                rejeicao: undefined,
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('pagamento_confirmado', 'Entrada marcada como isenta.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      registrarPagamentoFinal: (id, input) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            const recebidoEm = input.recebidoEm ?? new Date().toISOString()
            const pagamentoFinal: PagamentoSaldo = {
              ...contrato.pagamentoFinal,
              valor: input.valor,
              status: 'confirmado',
              formaPagamento: input.formaPagamento,
              recebidoEm,
              recebidoPor: input.recebidoPor ?? 'Equipe do estúdio',
              observacoes: input.observacoes,
            }

            return {
              ...contrato,
              pagamentoFinal,
              statusPagamentoFinal: 'confirmado',
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent(
                  'saldo_recebido',
                  `Saldo final de ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(input.valor)} recebido via ${input.formaPagamento}.`,
                ),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      marcarPagamentoFinalIsento: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato

            return {
              ...contrato,
              statusPagamentoFinal: 'isento',
              pagamentoFinal: {
                ...contrato.pagamentoFinal,
                status: 'isento',
                formaPagamento: undefined,
                recebidoEm: undefined,
                recebidoPor: undefined,
              },
              updatedAt: new Date().toISOString(),
              historico: [
                ...contrato.historico,
                historyEvent('saldo_isento', 'Saldo final marcado como isento.'),
              ],
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      reabrirPagamentoFinal: (id) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) => {
            if (contrato.id !== id) return contrato
            if (contrato.statusPagamentoFinal === 'confirmado') return contrato

            return {
              ...contrato,
              statusPagamentoFinal: 'pendente',
              pagamentoFinal: {
                ...contrato.pagamentoFinal,
                status: 'pendente',
                recebidoEm: undefined,
                recebidoPor: undefined,
              },
              updatedAt: new Date().toISOString(),
            }
          }),
        }))

        const updated = getState().contratos.find((contrato) => contrato.id === id)
        if (updated) syncAppointment(updated)
      },

      addHistory: (id, tipo, detalhe) => {
        setState((state) => ({
          contratos: state.contratos.map((contrato) =>
            contrato.id === id
              ? {
                  ...contrato,
                  updatedAt: new Date().toISOString(),
                  historico: [...contrato.historico, historyEvent(tipo, detalhe)],
                }
              : contrato,
          ),
        }))
      },

      restoreDemoData: () => {
        setState({ contratos: createContractSeedData().contracts })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { contratos?: Contrato[] } | undefined
        return {
          contratos: (state?.contratos ?? []).map(normalizeContract),
        }
      },
      partialize: (state) => ({ contratos: state.contratos }),
    },
  ),
)
