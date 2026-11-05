import { STATUS_META } from '@/domain/constants'
import type { Cliente, PacoteFotografico } from '@/domain/types'
import { cn } from '@/shared/lib/cn'
import { hexToRgba } from '@/shared/lib/colors'
import { formatTime } from '@/shared/lib/date'
import type { PositionedAppointment } from '@/features/agenda/lib/layout'

interface AppointmentBlockProps {
  layout: PositionedAppointment
  hourHeight: number
  pacote?: PacoteFotografico
  cliente?: Cliente
  contatoNome?: string
  onClick: () => void
}

export function AppointmentBlock({
  layout,
  hourHeight,
  pacote,
  cliente,
  contatoNome,
  onClick,
}: AppointmentBlockProps) {
  const { appointment, startMin, endMin, column, columns } = layout
  const top = (startMin / 60) * hourHeight
  const rawHeight = ((endMin - startMin) / 60) * hourHeight
  const height = Math.max(rawHeight - 2, 22)
  const widthPercent = 100 / columns
  const color = pacote?.corHex ?? '#64748b'
  const status = STATUS_META[appointment.status]
  const isReserved = appointment.status === 'reservado'
  const isCancelled = appointment.status === 'cancelado'
  const nomeContato = cliente?.nome ?? contatoNome ?? 'Cliente'

  return (
    <button
      type="button"
      data-appointment="true"
      title={`${nomeContato} · ${pacote?.nome ?? 'Pacote'} · ${
        status.label
      } · ${formatTime(appointment.dataHoraInicio)} – ${formatTime(appointment.dataHoraFim)}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={cn(
        'absolute z-10 overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:z-20 hover:brightness-105 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        isCancelled && 'line-through opacity-60',
      )}
      style={{
        top: `${top + 1}px`,
        height: `${height}px`,
        left: `calc(${column * widthPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
        backgroundColor: hexToRgba(color, 0.16),
        border: isReserved ? `1px dashed ${hexToRgba(color, 0.75)}` : '1px solid transparent',
        borderLeft: `3px solid ${color}`,
        color: '#1f2328',
      }}
    >
      <span className="line-clamp-2 font-semibold">{nomeContato}</span>

      {height > 40 ? (
        <span className="tabular mt-0.5 block truncate text-[10px] opacity-90">
          {formatTime(appointment.dataHoraInicio)} – {formatTime(appointment.dataHoraFim)}
        </span>
      ) : null}

      {height > 64 && pacote ? (
        <span className="mt-0.5 block truncate text-[10px] opacity-75">{pacote.nome}</span>
      ) : null}

      <span
        className={cn(
          'absolute right-1 top-1 size-1.5 rounded-full ring-1 ring-white/80',
          status.dot,
        )}
        aria-hidden="true"
      />
    </button>
  )
}
