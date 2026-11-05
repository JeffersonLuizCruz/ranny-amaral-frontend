import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  PagamentoEntrada,
  PagamentoSaldo,
  PagamentoStatus,
} from '@/domain/payments'
import { createSeedData } from '@/domain/seed'
import type { AgendamentoDraft, AgendamentoEnsaio, AgendamentoStatus } from '@/domain/types'
import { createId } from '@/shared/lib/id'

function normalizeAppointment(appointment: AgendamentoEnsaio): AgendamentoEnsaio {
  return {
    ...appointment,
    pagamentoFinal:
      appointment.pagamentoFinal ??
      ({
        valor: appointment.saldoRestante,
        status: appointment.saldoRestante > 0 ? 'pendente' : 'isento',
      } satisfies PagamentoSaldo),
  }
}

const STORAGE_KEY = 'photoizer.crm.appointments.v2'

interface AppointmentState {
  appointments: AgendamentoEnsaio[]
  createAppointment: (draft: AgendamentoDraft) => AgendamentoEnsaio
  updateAppointment: (id: string, draft: AgendamentoDraft) => void
  deleteAppointment: (id: string) => void
  updateStatus: (id: string, status: AgendamentoStatus) => void
  setDepositStatus: (id: string, status: PagamentoStatus) => void
  setPaymentEntrada: (id: string, pagamento: PagamentoEntrada) => void
  setPaymentFinal: (id: string, pagamento: PagamentoSaldo) => void
  linkContract: (id: string, contratoId: string) => void
  linkGallery: (id: string, galeriaId: string) => void
  linkClient: (id: string, clienteId: string) => void
  restoreDemoData: () => void
}

const seed = createSeedData()

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (setState) => ({
      appointments: seed.appointments,

      createAppointment: (draft) => {
        const timestamp = new Date().toISOString()
        const appointment: AgendamentoEnsaio = normalizeAppointment({
          ...draft,
          id: createId('apt'),
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        setState((state) => ({ appointments: [...state.appointments, appointment] }))
        return appointment
      },

      updateAppointment: (id, draft) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, ...draft, updatedAt: new Date().toISOString() }
              : appointment,
          ),
        }))
      },

      deleteAppointment: (id) => {
        setState((state) => ({
          appointments: state.appointments.filter((appointment) => appointment.id !== id),
        }))
      },

      updateStatus: (id, status) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status, updatedAt: new Date().toISOString() }
              : appointment,
          ),
        }))
      },

      setDepositStatus: (id, status) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) => {
            if (appointment.id !== id) return appointment

            const confirmado = status === 'confirmado'
            return normalizeAppointment({
              ...appointment,
              pagamentoEntrada: {
                ...appointment.pagamentoEntrada,
                status,
                confirmadoEm: confirmado ? new Date().toISOString() : undefined,
                confirmadoPor: confirmado ? 'Equipe do estúdio' : undefined,
                rejeicao: undefined,
                comprovante:
                  status === 'isento'
                    ? undefined
                    : appointment.pagamentoEntrada.comprovante,
              },
              updatedAt: new Date().toISOString(),
            })
          }),
        }))
      },

      setPaymentEntrada: (id, pagamento) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? normalizeAppointment({
                  ...appointment,
                  pagamentoEntrada: pagamento,
                  updatedAt: new Date().toISOString(),
                })
              : appointment,
          ),
        }))
      },

      setPaymentFinal: (id, pagamento) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? normalizeAppointment({
                  ...appointment,
                  pagamentoFinal: pagamento,
                  updatedAt: new Date().toISOString(),
                })
              : appointment,
          ),
        }))
      },

      linkContract: (id, contratoId) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, contratoId, updatedAt: new Date().toISOString() }
              : appointment,
          ),
        }))
      },

      linkGallery: (id, galeriaId) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, galeriaId, updatedAt: new Date().toISOString() }
              : appointment,
          ),
        }))
      },

      linkClient: (id, clienteId) => {
        setState((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, clienteId, updatedAt: new Date().toISOString() }
              : appointment,
          ),
        }))
      },

      restoreDemoData: () => {
        setState({ appointments: createSeedData().appointments })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { appointments?: AgendamentoEnsaio[] } | undefined
        return {
          appointments: (state?.appointments ?? []).map(normalizeAppointment),
        }
      },
      partialize: (state) => ({ appointments: state.appointments }),
    },
  ),
)
