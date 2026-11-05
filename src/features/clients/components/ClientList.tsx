import { CalendarDays, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react'

import { origemLabel } from '@/domain/constants'
import type { Cliente } from '@/domain/types'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { getInitials } from '@/shared/lib/text'
import { whatsappLink } from '@/shared/lib/whatsapp'

interface ClientListProps {
  clientes: Cliente[]
  appointmentCounts: Map<string, number>
  lastAppointments: Map<string, string>
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onCreateAppointment: (cliente: Cliente) => void
}

export function ClientList({
  clientes,
  appointmentCounts,
  lastAppointments,
  onEdit,
  onDelete,
  onCreateAppointment,
}: ClientListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {clientes.map((cliente) => {
        const count = appointmentCounts.get(cliente.id) ?? 0
        const lastAppointment = lastAppointments.get(cliente.id)

        return (
          <article
            key={cliente.id}
            className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
                {getInitials(cliente.nome)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-ink">{cliente.nome}</h3>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {cliente.whatsapp || 'WhatsApp não informado'}
                </p>
                {cliente.email ? (
                  <p className="truncate text-[11px] text-muted">{cliente.email}</p>
                ) : null}
                {cliente.documento ? (
                  <p className="truncate text-[11px] text-muted">
                    {cliente.tipoDocumento?.toUpperCase() ?? 'DOC'}: {cliente.documento}
                    {cliente.cidade ? ` · ${cliente.cidade}` : ''}
                  </p>
                ) : null}
              </div>
              <Badge className="shrink-0 bg-slate-50 text-slate-600 ring-slate-200">
                {origemLabel(cliente.origem)}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                <CalendarDays className="size-3" />
                {count} {count === 1 ? 'ensaio' : 'ensaios'}
              </span>
              {lastAppointment ? (
                <span className="truncate">Ensaio: {lastAppointment}</span>
              ) : (
                <span>Sem ensaios ainda</span>
              )}
            </div>

            {cliente.observacoes ? (
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
                {cliente.observacoes}
              </p>
            ) : null}

            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
              <Button size="sm" variant="secondary" onClick={() => onCreateAppointment(cliente)}>
                <Plus className="size-3.5" />
                Novo ensaio
              </Button>
              {cliente.whatsapp ? (
                <a
                  href={whatsappLink(cliente.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir WhatsApp de ${cliente.nome}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              ) : null}
              <div className="ml-auto flex items-center">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${cliente.nome}`}
                  onClick={() => onEdit(cliente)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Excluir ${cliente.nome}`}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete(cliente)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
