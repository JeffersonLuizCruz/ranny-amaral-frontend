import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Images, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { GaleriaStatus } from '@/domain/galleries'
import { GALERIA_STATUS_META, GALERIA_STATUS_ORDER, contarMidias } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { formatAppointmentDate } from '@/shared/lib/date'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { GalleryStatusBadge } from '@/features/galleries/components/GalleryStatusBadge'
import { CreateGalleryDialog } from '@/features/galleries/components/CreateGalleryDialog'

type FiltroStatus = 'todas' | GaleriaStatus

export function GalleriesPage() {
  const galerias = useGalleryStore((state) => state.galerias)
  const appointments = useAppointmentStore((state) => state.appointments)
  const clientes = useClientStore((state) => state.clientes)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<FiltroStatus>('todas')
  const [creating, setCreating] = useState(false)

  const clientesById = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes],
  )
  const appointmentsById = useMemo(
    () => new Map(appointments.map((appointment) => [appointment.id, appointment])),
    [appointments],
  )

  const filtradas = useMemo(() => {
    const term = query.trim().toLowerCase()

    return galerias
      .filter((galeria) => status === 'todas' || galeria.status === status)
      .filter((galeria) => {
        if (!term) return true
        const appointment = appointmentsById.get(galeria.agendamentoId)
        const cliente = appointment?.clienteId
          ? clientesById.get(appointment.clienteId)
          : undefined
        const nome = cliente?.nome ?? appointment?.contato?.nome ?? ''
        return nome.toLowerCase().includes(term)
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [appointmentsById, clientesById, galerias, query, status])

  const ativas = galerias.filter(
    (galeria) => !['entregue', 'cancelada'].includes(galeria.status),
  ).length

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Galerias</h2>
            <p className="mt-0.5 text-xs text-muted">
              {galerias.length} {galerias.length === 1 ? 'galeria' : 'galerias'} ·{' '}
              {ativas} em andamento
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nova galeria
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por cliente"
              className={cn(inputClass, 'pl-10')}
              aria-label="Buscar galeria por cliente"
            />
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            <FilterChip active={status === 'todas'} onClick={() => setStatus('todas')}>
              Todas
            </FilterChip>
            {GALERIA_STATUS_ORDER.map((item) => (
              <FilterChip
                key={item}
                active={status === item}
                onClick={() => setStatus(item)}
              >
                {GALERIA_STATUS_META[item].label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {filtradas.length === 0 ? (
          <EmptyState
            icon={Images}
            title={
              galerias.length === 0 ? 'Nenhuma galeria criada' : 'Nenhuma galeria encontrada'
            }
            description={
              galerias.length === 0
                ? 'Crie a primeira galeria a partir de um ensaio realizado.'
                : 'Ajuste a busca ou o filtro de status.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Nova galeria
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtradas.map((galeria) => {
              const appointment = appointmentsById.get(galeria.agendamentoId)
              const cliente = appointment?.clienteId
                ? clientesById.get(appointment.clienteId)
                : undefined
              const nome =
                cliente?.nome ??
                appointment?.contato?.nome ??
                'Reserva sem cliente'
              const fotos = contarMidias(galeria.midias, 'foto')
              const videos = contarMidias(galeria.midias, 'video')

              return (
                <Link
                  key={galeria.id}
                  to={`/galerias/${galeria.id}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-slate-300 hover:shadow-float"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{nome}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {appointment
                          ? formatAppointmentDate(
                              appointment.dataHoraInicio,
                              appointment.dataHoraFim,
                            )
                          : 'Ensaio não encontrado'}
                      </p>
                    </div>
                    <GalleryStatusBadge status={galeria.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    <span className="rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                      {fotos} fotos
                    </span>
                    <span className="rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                      {videos} vídeos
                    </span>
                    {galeria.selecao ? (
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700 ring-1 ring-brand-100">
                        {galeria.selecao.fotosExtras} extras
                      </span>
                    ) : null}
                  </div>

                  {galeria.pedidoExtras?.status === 'pendente' ? (
                    <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
                      Aguardando pagamento dos extras
                    </p>
                  ) : galeria.entrega?.status === 'disponivel' ? (
                    <p className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Entrega disponível · {galeria.entrega.quantidadeDownloads} download(s)
                    </p>
                  ) : null}

                  <span className="mt-3 inline-flex text-[11px] font-semibold text-brand-700 group-hover:underline">
                    Abrir galeria
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <CreateGalleryDialog
        key={creating ? 'create-open' : 'create-closed'}
        open={creating}
        onClose={() => setCreating(false)}
      />
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-medium ring-1 transition',
        active
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-surface text-muted ring-line hover:bg-slate-50 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
