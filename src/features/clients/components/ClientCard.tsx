import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronRight,
  Images,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { origemLabel, STATUS_META } from '@/domain/constants'
import { GALERIA_STATUS_META } from '@/domain/galleries'
import type { Cliente, PacoteFotografico } from '@/domain/types'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { getInitials } from '@/shared/lib/text'
import { whatsappLink } from '@/shared/lib/whatsapp'
import {
  STATUS_FINANCEIRO_META,
  type ResumoCliente,
} from '@/features/clients/lib/profile'

interface ClientCardProps {
  cliente: Cliente
  resumo: ResumoCliente
  pacotesById: Map<string, PacoteFotografico>
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onCreateAppointment: (cliente: Cliente) => void
}

export function ClientCard({
  cliente,
  resumo,
  pacotesById,
  onEdit,
  onDelete,
  onCreateAppointment,
}: ClientCardProps) {
  const ensaio = resumo.proximoEnsaio ?? resumo.ultimoEnsaio
  const pacote = ensaio ? pacotesById.get(ensaio.pacoteId) : undefined
  const financeiro = STATUS_FINANCEIRO_META[resumo.statusFinanceiro]
  const galeria = resumo.galeriaAtiva ?? resumo.ultimaGaleria
  const galeriaMeta = galeria ? GALERIA_STATUS_META[galeria.status] : undefined
  const desde = format(new Date(cliente.createdAt), "MMMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-slate-300 hover:shadow-lg">
      <Link
        to={`/clientes/${cliente.id}`}
        aria-label={`Abrir ficha de ${cliente.nome}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            {getInitials(cliente.nome)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {cliente.nome}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {origemLabel(cliente.origem)} · cliente desde {desde}
                  {resumo.recorrente ? ' · recorrente' : ''}
                </p>
              </div>
              <Badge className={`shrink-0 ${financeiro.badge}`}>
                <span className={`size-1.5 rounded-full ${financeiro.dot}`} />
                {financeiro.label}
              </Badge>
            </div>
            <p className="mt-1 truncate text-[11px] text-muted">
              {cliente.whatsapp || 'WhatsApp não informado'}
              {cliente.email ? ` · ${cliente.email}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-2.5">
          {ensaio ? (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {resumo.proximoEnsaio ? 'Próximo ensaio' : 'Último ensaio'}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-ink">
                  {format(new Date(ensaio.dataHoraInicio), "d 'de' MMM", {
                    locale: ptBR,
                  })}{' '}
                  · {format(new Date(ensaio.dataHoraInicio), 'HH:mm')}
                  {pacote ? ` · ${pacote.nome}` : ''}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {STATUS_META[ensaio.status].label} · {ensaio.local}
                </p>
              </div>
              {pacote ? (
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: pacote.corHex }}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-muted">Nenhum ensaio registrado.</p>
          )}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <ValorFinanceiro rotulo="Contratado" valor={resumo.contratado} />
          <ValorFinanceiro
            rotulo="Recebido"
            valor={resumo.recebido}
            tom="positivo"
          />
          <ValorFinanceiro
            rotulo="Pendente"
            valor={resumo.pendente}
            tom={resumo.pendente > 0 ? 'atencao' : undefined}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {resumo.totalEnsaios}{' '}
            {resumo.totalEnsaios === 1 ? 'ensaio' : 'ensaios'}
          </span>
          {galeria && galeriaMeta ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Images className="size-3 shrink-0" />
              <span className={`size-1.5 shrink-0 rounded-full ${galeriaMeta.dot}`} />
              <span className="truncate">
                {galeriaMeta.label}
                {galeria.fotosSelecionadas
                  ? ` · ${galeria.fotosProntas ?? 0}/${galeria.fotosSelecionadas} prontas`
                  : galeria.totalFotos
                    ? ` · ${galeria.totalFotos} fotos`
                    : ''}
              </span>
            </span>
          ) : null}
        </div>

        {cliente.observacoes ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
            {cliente.observacoes}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
            Ver ficha
            <ChevronRight className="size-3.5" />
          </span>
          {cliente.whatsapp ? (
            <a
              href={whatsappLink(cliente.whatsapp)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir WhatsApp de ${cliente.nome}`}
              className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            className="pointer-events-auto"
            onClick={() => onCreateAppointment(cliente)}
          >
            <Plus className="size-3.5" />
            Novo ensaio
          </Button>
          <div className="pointer-events-auto ml-auto flex items-center">
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
      </div>
    </article>
  )
}

function ValorFinanceiro({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string
  valor: number
  tom?: 'positivo' | 'atencao'
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted">{rotulo}</p>
      <p
        className={
          tom === 'positivo'
            ? 'text-sm font-semibold text-emerald-600'
            : tom === 'atencao'
              ? 'text-sm font-semibold text-amber-700'
              : 'text-sm font-semibold text-ink'
        }
      >
        {formatBRL(valor)}
      </p>
    </div>
  )
}
