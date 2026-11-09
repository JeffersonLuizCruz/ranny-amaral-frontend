import {
  CheckCircle2,
  FileText,
  Link2,
  Pencil,
  Send,
  XCircle,
} from 'lucide-react'

import type { ContratoEventoTipo } from '@/domain/contracts'
import { cn } from '@/shared/lib/cn'

const EVENT_META: Record<
  ContratoEventoTipo,
  { label: string; icon: typeof FileText; color: string }
> = {
  criado: { label: 'Contrato criado', icon: FileText, color: 'text-slate-500 bg-slate-100' },
  atualizado: { label: 'Contrato atualizado', icon: Pencil, color: 'text-slate-500 bg-slate-100' },
  link_gerado: { label: 'Link de aceite gerado', icon: Link2, color: 'text-amber-700 bg-amber-50' },
  cliente_criado: { label: 'Cliente criado', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  cliente_vinculado: { label: 'Cliente vinculado', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  comprovante_enviado: { label: 'Comprovante enviado', icon: FileText, color: 'text-blue-700 bg-blue-50' },
  pagamento_confirmado: { label: 'Entrada confirmada', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  pagamento_rejeitado: { label: 'Comprovante rejeitado', icon: XCircle, color: 'text-red-700 bg-red-50' },
  saldo_recebido: { label: 'Saldo final recebido', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  saldo_isento: { label: 'Saldo final isento', icon: CheckCircle2, color: 'text-slate-500 bg-slate-100' },
  link_visualizado: { label: 'Link visualizado', icon: Send, color: 'text-blue-700 bg-blue-50' },
  aceite_registrado: { label: 'Aceite registrado', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  link_expirado: { label: 'Link expirado', icon: XCircle, color: 'text-orange-700 bg-orange-50' },
  link_cancelado: { label: 'Link cancelado', icon: XCircle, color: 'text-red-700 bg-red-50' },
  contrato_cancelado: { label: 'Contrato cancelado', icon: XCircle, color: 'text-red-700 bg-red-50' },
  reaberto: { label: 'Contrato reaberto', icon: Pencil, color: 'text-slate-500 bg-slate-100' },
  pdf_gerado: { label: 'PDF gerado', icon: FileText, color: 'text-slate-500 bg-slate-100' },
  duplicado: { label: 'Contrato duplicado', icon: FileText, color: 'text-slate-500 bg-slate-100' },
}

interface ContractTimelineProps {
  contrato: { historico: Array<{ id: string; tipo: ContratoEventoTipo; em: string; detalhe?: string }> }
}

export function ContractTimeline({ contrato }: ContractTimelineProps) {
  const events = [...contrato.historico].sort(
    (a, b) => new Date(b.em).getTime() - new Date(a.em).getTime(),
  )

  if (events.length === 0) {
    return <p className="text-xs text-muted">Nenhum evento registrado.</p>
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => {
        const meta = EVENT_META[event.tipo]
        const Icon = meta.icon

        return (
          <li key={event.id} className="flex gap-2.5">
            <span
              className={cn(
                'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full',
                meta.color,
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink">{meta.label}</p>
              <p className="text-[10px] text-muted">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(event.em))}
              </p>
              {event.detalhe ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {event.detalhe}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
