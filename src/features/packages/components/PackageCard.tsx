import {
  Archive,
  CalendarDays,
  Check,
  Images,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'

import type { PacoteFotografico } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { hexToRgba } from '@/shared/lib/colors'
import { formatBRL } from '@/shared/lib/currency'
import { formatDuration } from '@/shared/lib/date'
import {
  descontoPacote,
  promocaoVigente,
  valorEfetivoPacote,
} from '@/features/packages/lib/pricing'

interface PackageCardProps {
  pacote: PacoteFotografico
  appointmentCount: number
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

export function PackageCard({
  pacote,
  appointmentCount,
  onEdit,
  onToggleActive,
  onDelete,
}: PackageCardProps) {
  const temPromocao = promocaoVigente(pacote)
  const valorEfetivo = valorEfetivoPacote(pacote, temPromocao)
  const desconto = descontoPacote(pacote, temPromocao)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="h-1.5 w-full" style={{ backgroundColor: pacote.corHex }} aria-hidden="true" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink">{pacote.nome}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
              {pacote.descricao || 'Sem descrição.'}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
              pacote.ativo
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-slate-100 text-slate-500 ring-slate-200',
            )}
          >
            {pacote.ativo ? 'Ativo' : 'Arquivado'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: hexToRgba(pacote.corHex, 0.12),
              color: '#1f2328',
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: pacote.corHex }}
            />
            {formatDuration(pacote.duracaoMinutos)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-line">
            {formatBRL(valorEfetivo)}
          </span>
          {desconto > 0 ? (
            <span className="text-[11px] text-muted line-through">
              {formatBRL(pacote.valor)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] text-muted ring-1 ring-line">
            <CalendarDays className="size-3" />
            {appointmentCount} {appointmentCount === 1 ? 'ensaio' : 'ensaios'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100">
            <Images className="size-3" />
            {pacote.quantidadeFotosInclusas} fotos
          </span>
          {pacote.quantidadeVideosInclusos > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700 ring-1 ring-purple-100">
              <Video className="size-3" />
              {pacote.quantidadeVideosInclusos}{' '}
              {pacote.quantidadeVideosInclusos === 1 ? 'vídeo' : 'vídeos'}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-100">
            Extra {formatBRL(pacote.valorFotoExtra)}
          </span>
        </div>

        {temPromocao ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
              <Sparkles className="size-3.5" />
              {pacote.promocao?.rotulo || 'Promoção ativa'}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-700">
              De {formatBRL(pacote.valor)} por {formatBRL(valorEfetivo)} · economia de{' '}
              {formatBRL(desconto)}
            </p>
          </div>
        ) : null}

        {pacote.itensInclusos.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {pacote.itensInclusos.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-2 text-xs text-ink">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil className="size-3.5" />
            Editar
          </Button>

          <Button size="sm" variant="ghost" onClick={onToggleActive}>
            {pacote.ativo ? (
              <>
                <Archive className="size-3.5" />
                Arquivar
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                Reativar
              </>
            )}
          </Button>

          {appointmentCount === 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
