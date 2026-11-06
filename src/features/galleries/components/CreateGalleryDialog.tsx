import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Images, Wallet } from 'lucide-react'

import type { AgendamentoEnsaio } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { formatAppointmentDate } from '@/shared/lib/date'
import { useToastStore } from '@/shared/store/toastStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { useCrmLookups } from '@/features/appointments/lib/lookups'

interface CreateGalleryDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateGalleryDialog({ open, onClose }: CreateGalleryDialogProps) {
  const navigate = useNavigate()
  const appointments = useAppointmentStore((state) => state.appointments)
  const contratos = useContractStore((state) => state.contratos)
  const galerias = useGalleryStore((state) => state.galerias)
  const createGallery = useGalleryStore((state) => state.createGallery)
  const addToast = useToastStore((state) => state.addToast)
  const { clientesById } = useCrmLookups()
  const [selected, setSelected] = useState<string | null>(null)

  const elegiveis = useMemo(() => {
    const galleryByAppointment = new Set(
      galerias.map((galeria) => galeria.agendamentoId),
    )

    return appointments.filter((appointment) => {
      if (galleryByAppointment.has(appointment.id)) return false
      if (appointment.status !== 'realizado') return false

      const contrato = contratos.find(
        (item) => item.agendamentoId === appointment.id,
      )
      const entradaOk =
        contrato?.statusPagamento === 'confirmado' ||
        contrato?.statusPagamento === 'isento' ||
        appointment.pagamentoEntrada.status === 'confirmado' ||
        appointment.pagamentoEntrada.status === 'isento'
      const saldoOk =
        contrato?.statusPagamentoFinal === 'confirmado' ||
        contrato?.statusPagamentoFinal === 'isento' ||
        appointment.pagamentoFinal?.status === 'confirmado' ||
        appointment.pagamentoFinal?.status === 'isento'

      return entradaOk && saldoOk
    })
  }, [appointments, contratos, galerias])

  const handleCreate = async (appointment: AgendamentoEnsaio) => {
    try {
      const galeria = await createGallery(appointment.id)
      addToast('Galeria criada.')
      setSelected(null)
      onClose()
      navigate(`/galerias/${galeria.id}`)
    } catch {
      addToast('Não foi possível criar a galeria.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova galeria"
      description="Selecione um ensaio realizado e com pagamentos quitados."
    >
      {elegiveis.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Nenhum ensaio elegível"
          description="Marque o ensaio como realizado e registre o saldo final antes de criar a galeria."
        />
      ) : (
        <div className="space-y-2">
          {elegiveis.map((appointment) => {
            const cliente = appointment.clienteId
              ? clientesById.get(appointment.clienteId)
              : undefined
            const nome =
              cliente?.nome ?? appointment.contato?.nome ?? 'Reserva sem cliente'
            const isSelected = selected === appointment.id

            return (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setSelected(appointment.id)}
                className={
                  isSelected
                    ? 'w-full rounded-xl border border-brand-400 bg-brand-50/60 p-3 text-left ring-1 ring-brand-300'
                    : 'w-full rounded-xl border border-line bg-surface p-3 text-left transition hover:border-slate-300 hover:bg-slate-50/60'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{nome}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatAppointmentDate(
                        appointment.dataHoraInicio,
                        appointment.dataHoraFim,
                      )}
                    </p>
                  </div>
                  <Wallet className="size-4 shrink-0 text-emerald-600" />
                </div>
              </button>
            )
          })}

          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selected}
              onClick={() => {
                const appointment = elegiveis.find((item) => item.id === selected)
                if (appointment) handleCreate(appointment)
              }}
            >
              <Images className="size-4" />
              Criar galeria
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
