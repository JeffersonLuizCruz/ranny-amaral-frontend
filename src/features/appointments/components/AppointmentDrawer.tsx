import { useNavigate } from 'react-router-dom'

import type { AgendamentoDraft, AgendamentoStatus } from '@/domain/types'
import { Drawer } from '@/shared/components/ui/Drawer'
import { toDateKey } from '@/shared/lib/date'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { createBookingWithContract, updateBookingWithContract } from '@/features/appointments/lib/booking'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { AppointmentDetails } from '@/features/appointments/components/AppointmentDetails'
import { AppointmentForm } from '@/features/appointments/components/AppointmentForm'

export function AppointmentDrawer() {
  const navigate = useNavigate()
  const drawer = useAgendaStore((state) => state.drawer)
  const closeDrawer = useAgendaStore((state) => state.closeDrawer)
  const openAppointmentDrawer = useAgendaStore((state) => state.openAppointmentDrawer)
  const setSelectedDate = useAgendaStore((state) => state.setSelectedDate)

  const appointments = useAppointmentStore((state) => state.appointments)
  const deleteAppointment = useAppointmentStore((state) => state.deleteAppointment)
  const updateStatus = useAppointmentStore((state) => state.updateStatus)
  const contracts = useContractStore((state) => state.contratos)
  const deleteContract = useContractStore((state) => state.deleteContract)
  const addToast = useToastStore((state) => state.addToast)

  const appointment = drawer.appointmentId
    ? appointments.find((item) => item.id === drawer.appointmentId)
    : undefined
  const open = drawer.mode !== null

  const title =
    drawer.mode === 'create'
      ? 'Novo ensaio'
      : drawer.mode === 'edit'
        ? 'Editar ensaio'
        : 'Detalhes do ensaio'

  const handleSubmit = async (draft: AgendamentoDraft) => {
    try {
      if (drawer.mode === 'edit' && appointment) {
        const result = await updateBookingWithContract(appointment.id, draft)

        if (result.contractLocked) {
          addToast(
            'Este ensaio já possui contrato enviado ou aceito. Cancele o contrato antes de alterar.',
          )
          return
        }

        addToast(result.contract ? 'Ensaio e contrato atualizados.' : 'Ensaio atualizado.')
      } else {
        const result = await createBookingWithContract(draft)

        if (result.contract) {
          addToast('Ensaio criado. Contrato em rascunho.', {
            actionLabel: 'Abrir contrato',
            onAction: () => navigate(`/contratos/${result.contract?.id}`),
            duration: 8_000,
          })
        } else {
          addToast('Ensaio criado, mas nenhum modelo de contrato ativo foi encontrado.')
        }
      }

      setSelectedDate(toDateKey(new Date(draft.dataHoraInicio)))
      closeDrawer()
      navigate('/agenda')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDelete = async () => {
    if (!appointment) return

    const contract = contracts.find((item) => item.agendamentoId === appointment.id)

    if (contract && contract.statusAceite !== 'rascunho') {
      addToast('Este ensaio possui contrato enviado ou aceito. Cancele o contrato antes de excluir.')
      return
    }

    try {
      if (contract) await deleteContract(contract.id)
      await deleteAppointment(appointment.id)
      addToast('Ensaio excluído.')
      closeDrawer()
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleStatusChange = async (status: AgendamentoStatus) => {
    if (!appointment) return

    try {
      await updateStatus(appointment.id, status)
      addToast('Status atualizado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <Drawer
      open={open}
      onClose={closeDrawer}
      title={title}
      description={
        drawer.mode === 'create'
          ? 'Preencha os dados do ensaio. Você poderá editar depois.'
          : drawer.mode === 'view'
            ? 'Confira as informações, altere o status ou edite o ensaio.'
            : undefined
      }
    >
      {drawer.mode === 'create' ? (
        <AppointmentForm
          key={`create-${drawer.defaultDate}-${drawer.defaultStartTime}-${drawer.defaultClienteId}`}
          defaultDate={drawer.defaultDate ?? ''}
          defaultStartTime={drawer.defaultStartTime ?? '09:00'}
          defaultClienteId={drawer.defaultClienteId}
          onSubmit={handleSubmit}
          onCancel={closeDrawer}
        />
      ) : null}

      {drawer.mode === 'edit' && appointment ? (
        <AppointmentForm
          key={`edit-${appointment.id}`}
          appointment={appointment}
          defaultDate=""
          defaultStartTime="09:00"
          onSubmit={handleSubmit}
          onCancel={closeDrawer}
        />
      ) : null}

      {drawer.mode === 'view' && appointment ? (
        <AppointmentDetails
          appointment={appointment}
          onEdit={() => openAppointmentDrawer(appointment.id, 'edit')}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onClose={closeDrawer}
        />
      ) : null}

      {drawer.mode !== null && drawer.mode !== 'create' && !appointment ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted">Este ensaio não existe mais.</p>
          <button
            type="button"
            onClick={closeDrawer}
            className="mt-3 text-sm font-medium text-brand-700 hover:underline"
          >
            Fechar
          </button>
        </div>
      ) : null}
    </Drawer>
  )
}
