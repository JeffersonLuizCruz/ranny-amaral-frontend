import type {
  AgendamentoDraft,
  AgendamentoEnsaio,
} from '@/domain/types'
import type { Contrato } from '@/domain/contracts'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { buildContractDraftFromAppointment } from '@/features/contracts/lib/contractBuilder'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { useTemplateStore } from '@/features/contracts/store/templateStore'
import { usePackageStore } from '@/features/packages/store/packageStore'

export interface BookingResult {
  appointment: AgendamentoEnsaio
  contract: Contrato | null
  contractLocked?: boolean
}

function findDefaultTemplate(modeloId?: string) {
  const templates = useTemplateStore.getState().modelos
  return (
    templates.find((template) => template.id === modeloId) ??
    templates.find((template) => template.ativo) ??
    templates[0]
  )
}

async function buildContractForAppointment(
  appointment: AgendamentoEnsaio,
  modeloId?: string,
): Promise<Contrato | null> {
  const template = findDefaultTemplate(modeloId)
  if (!template) return null

  const pacote = usePackageStore
    .getState()
    .pacotes.find((item) => item.id === appointment.pacoteId)
  if (!pacote) return null

  const cliente = appointment.clienteId
    ? useClientStore
        .getState()
        .clientes.find((item) => item.id === appointment.clienteId)
    : undefined

  const draft = buildContractDraftFromAppointment({
    numero: 'PREVIA',
    appointment,
    pacote,
    cliente,
    studio: useStudioStore.getState().estudio,
    template,
  })

  return useContractStore.getState().createContract(draft)
}

export async function createBookingWithContract(
  draft: AgendamentoDraft,
): Promise<BookingResult> {
  const appointmentStore = useAppointmentStore.getState()
  const appointment = await appointmentStore.createAppointment(draft)

  try {
    const contract = await buildContractForAppointment(appointment)

    if (contract) {
      appointmentStore.linkContract(appointment.id, contract.id)
    }

    return { appointment, contract }
  } catch (error) {
    // Compensa a criação parcial: sem contrato, o ensaio não deve ficar órfão.
    await appointmentStore.deleteAppointment(appointment.id).catch(() => undefined)
    throw error
  }
}

export async function updateBookingWithContract(
  id: string,
  draft: AgendamentoDraft,
): Promise<BookingResult> {
  const appointmentStore = useAppointmentStore.getState()
  const existing = appointmentStore.appointments.find((item) => item.id === id)

  if (!existing) {
    throw new Error('Ensaio não encontrado.')
  }

  const contract = useContractStore
    .getState()
    .contratos.find((item) => item.agendamentoId === id)

  if (contract && contract.statusAceite !== 'rascunho') {
    return { appointment: existing, contract, contractLocked: true }
  }

  await appointmentStore.updateAppointment(id, draft)
  const appointment =
    useAppointmentStore.getState().appointments.find((item) => item.id === id) ?? existing

  if (!contract) {
    const created = await buildContractForAppointment(appointment)
    if (created) appointmentStore.linkContract(appointment.id, created.id)
    return { appointment, contract: created }
  }

  const template = findDefaultTemplate(contract.modeloId)
  const pacote = usePackageStore
    .getState()
    .pacotes.find((item) => item.id === appointment.pacoteId)
  const cliente = appointment.clienteId
    ? useClientStore
        .getState()
        .clientes.find((item) => item.id === appointment.clienteId)
    : undefined

  if (!template || !pacote) {
    return { appointment, contract }
  }

  const contractDraft = buildContractDraftFromAppointment({
    numero: contract.numero,
    appointment,
    pacote,
    cliente,
    studio: useStudioStore.getState().estudio,
    template,
  })

  const updated = await useContractStore
    .getState()
    .updateContract(contract.id, contractDraft)

  return { appointment, contract: updated }
}
