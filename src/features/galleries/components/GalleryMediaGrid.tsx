import { Check, Download, Film, ImageOff, Loader2, Lock, Pencil, PlayCircle, Trash2 } from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import { cn } from '@/shared/lib/cn'

interface GalleryMediaGridProps {
  midias: MidiaGaleria[]
  selectedIds?: Set<string>
  lockedIds?: Set<string>
  onToggle?: (id: string) => void
  onRemove?: (midia: MidiaGaleria) => void
  onDownload?: (midia: MidiaGaleria) => void
  onEdit?: (midia: MidiaGaleria) => void
  emptyLabel?: string
  watermark?: boolean
  numerarFotos?: boolean
  hideEditBadge?: boolean
}

export function GalleryMediaGrid({
  midias,
  selectedIds,
  lockedIds,
  onToggle,
  onRemove,
  onDownload,
  onEdit,
  emptyLabel = 'Nenhuma mídia enviada ainda.',
  watermark = false,
  numerarFotos = false,
  hideEditBadge = false,
}: GalleryMediaGridProps) {
  if (midias.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center">
        <ImageOff className="mx-auto size-6 text-muted" />
        <p className="mt-2 text-xs text-muted">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {midias.map((midia) => (
        <GalleryMediaTile
          key={midia.id}
          midia={midia}
          selected={selectedIds?.has(midia.id) ?? false}
          locked={lockedIds?.has(midia.id) ?? false}
          onToggle={onToggle}
          onRemove={onRemove}
          onDownload={onDownload}
          onEdit={onEdit}
          watermark={watermark}
          numerarFotos={numerarFotos}
          hideEditBadge={hideEditBadge}
        />
      ))}
    </div>
  )
}

function GalleryMediaTile({
  midia,
  selected,
  locked,
  onToggle,
  onRemove,
  onDownload,
  onEdit,
  watermark,
  numerarFotos,
  hideEditBadge,
}: {
  midia: MidiaGaleria
  selected: boolean
  locked: boolean
  onToggle?: (id: string) => void
  onRemove?: (midia: MidiaGaleria) => void
  onDownload?: (midia: MidiaGaleria) => void
  onEdit?: (midia: MidiaGaleria) => void
  watermark?: boolean
  numerarFotos?: boolean
  hideEditBadge?: boolean
}) {
  const url =
    midia.thumbUrl ?? midia.webUrl ?? midia.editadaUrl ?? midia.originalUrl ?? null
  const isVideo = midia.tipo === 'video'
  const numeroVisivel = numerarFotos && midia.tipo === 'foto'
  const podeAlternar = Boolean(onToggle) && !locked

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-slate-100',
        selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-line',
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (podeAlternar) onToggle?.(midia.id)
        }}
        disabled={!podeAlternar}
        className={cn(
          'relative block aspect-square w-full overflow-hidden text-left',
          podeAlternar ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-pressed={onToggle ? selected : undefined}
      >
        {url ? (
          isVideo ? (
            <video
              src={url}
              muted
              playsInline
              controls={false}
              className="size-full object-cover"
            />
          ) : (
            <img
              src={url}
              alt={midia.nomeArquivo}
              loading="lazy"
              className="size-full object-cover"
            />
          )
        ) : (
          <span className="grid size-full place-items-center text-muted">
            {isVideo ? <Film className="size-6" /> : <ImageOff className="size-6" />}
          </span>
        )}

        {watermark ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
          >
            <span className="-rotate-12 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45 drop-shadow">
              prévia
            </span>
          </span>
        ) : null}

        {numeroVisivel ? (
          <span
            aria-label={`Foto ${midia.numero}`}
            title={`Foto ${formatarNumeroFoto(midia.numero)}`}
            className="absolute left-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow"
          >
            {formatarNumeroFoto(midia.numero)}
          </span>
        ) : null}

        {isVideo ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
            <Film className="size-2.5" />
            vídeo
          </span>
        ) : null}

        {locked ? (
          <span
            className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-slate-900/80 text-white shadow"
            title="Mídia já entregue; permanece obrigatória"
            aria-label="Mídia já entregue"
          >
            <Lock className="size-3" />
          </span>
        ) : selected ? (
          <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand-600 text-white shadow">
            <Check className="size-3" />
          </span>
        ) : null}

        {!hideEditBadge && midia.editadaDisponivel ? (
          <span
            className={cn(
              'absolute left-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow',
              numeroVisivel ? 'top-9' : 'top-1.5',
            )}
          >
            <Check className="size-2.5" />
            editada
          </span>
        ) : null}
      </button>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4">
        {midia.processamentoStatus === 'processando' || midia.editadaProcessando ? (
          <Loader2
            aria-label="Processando"
            className="size-3 shrink-0 animate-spin text-white"
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-white/90">
          {midia.nomeArquivo}
        </span>
        {isVideo && url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Pré-visualizar ${midia.nomeArquivo}`}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-purple-700 transition hover:bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <PlayCircle className="size-3" />
          </a>
        ) : null}
        {onEdit && !isVideo ? (
          <button
            type="button"
            onClick={() => onEdit(midia)}
            aria-label={`Editar versão de ${midia.nomeArquivo}`}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-purple-700 transition hover:bg-white"
          >
            <Pencil className="size-3" />
          </button>
        ) : null}
        {onDownload ? (
          <button
            type="button"
            onClick={() => onDownload(midia)}
            aria-label={`Baixar ${midia.nomeArquivo}`}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-ink transition hover:bg-white"
          >
            <Download className="size-3" />
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(midia)}
            aria-label={`Remover ${midia.nomeArquivo}`}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-red-600 transition hover:bg-white"
          >
            <Trash2 className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
