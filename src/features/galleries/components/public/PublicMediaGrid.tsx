import {
  Check,
  Download,
  Film,
  ImageOff,
  Lock,
  Maximize2,
  PlayCircle,
} from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import { cn } from '@/shared/lib/cn'

interface PublicMediaGridProps {
  midias: MidiaGaleria[]
  selectedIds?: Set<string>
  lockedIds?: Set<string>
  onToggle?: (id: string) => void
  onZoom?: (midia: MidiaGaleria) => void
  onDownload?: (midia: MidiaGaleria) => void
  watermark?: boolean
  watermarkText?: string
  numerarFotos?: boolean
  emptyLabel?: string
}

export function PublicMediaGrid({
  midias,
  selectedIds,
  lockedIds,
  onToggle,
  onZoom,
  onDownload,
  watermark = false,
  watermarkText,
  numerarFotos = false,
  emptyLabel = 'Nenhuma mídia disponível.',
}: PublicMediaGridProps) {
  if (midias.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E1D3C1] bg-white/40 px-6 py-10 text-center backdrop-blur">
        <ImageOff className="mx-auto size-6 text-[#A08B72]" />
        <p className="mt-2 text-xs text-[#8A7863]">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {midias.map((midia) => (
        <PublicMediaCard
          key={midia.id}
          midia={midia}
          selected={selectedIds?.has(midia.id) ?? false}
          locked={lockedIds?.has(midia.id) ?? false}
          onToggle={onToggle}
          onZoom={onZoom}
          onDownload={onDownload}
          watermark={watermark}
          watermarkText={watermarkText}
          numerarFotos={numerarFotos}
        />
      ))}
    </div>
  )
}

function PublicMediaCard({
  midia,
  selected,
  locked,
  onToggle,
  onZoom,
  onDownload,
  watermark,
  watermarkText,
  numerarFotos,
}: {
  midia: MidiaGaleria
  selected: boolean
  locked: boolean
  onToggle?: (id: string) => void
  onZoom?: (midia: MidiaGaleria) => void
  onDownload?: (midia: MidiaGaleria) => void
  watermark?: boolean
  watermarkText?: string
  numerarFotos?: boolean
}) {
  const isVideo = midia.tipo === 'video'
  const previewUrl =
    midia.thumbUrl ?? midia.webUrl ?? midia.editadaUrl ?? midia.originalUrl ?? null
  const videoUrl = midia.originalUrl ?? midia.webUrl ?? midia.thumbUrl ?? null
  const numeroVisivel = numerarFotos && midia.tipo === 'foto'
  const rotulo = isVideo
    ? 'vídeo'
    : `foto ${formatarNumeroFoto(midia.numero)}`
  const mainAction = onToggle
    ? () => onToggle(midia.id)
    : onZoom
      ? () => onZoom(midia)
      : undefined
  const selecionavel = Boolean(onToggle) && !locked

  return (
    <article className="group relative">
      <button
        type="button"
        onClick={mainAction}
        disabled={!mainAction || (Boolean(onToggle) && locked)}
        aria-pressed={onToggle ? selected : undefined}
        aria-label={
          onToggle
            ? `${selected ? 'Remover' : 'Selecionar'} ${rotulo}${locked ? ' (já entregue)' : ''}`
            : `Abrir ${rotulo} em tela cheia`
        }
        className={cn(
          'relative block w-full overflow-hidden rounded-[1.15rem] bg-[#EFE5D8] text-left shadow-[0_20px_45px_-32px_rgba(60,42,25,0.65)] ring-1 ring-[#E7DCCD] transition duration-300',
          selecionavel && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(60,42,25,0.7)]',
          selected &&
            'ring-2 ring-[var(--gallery-accent)] ring-offset-2 ring-offset-[#FBF7F2]',
          locked && 'cursor-default',
        )}
      >
        <span className="relative block aspect-[4/5] overflow-hidden">
          {previewUrl ? (
            isVideo ? (
              videoUrl ? (
                <video
                  src={videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={midia.nomeArquivo}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition duration-700 group-hover:scale-[1.035]"
                />
              )
            ) : (
              <img
                src={previewUrl}
                alt={midia.nomeArquivo}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition duration-700 group-hover:scale-[1.035]"
              />
            )
          ) : (
            <span className="grid size-full place-items-center text-[#A08B72]">
              {isVideo ? (
                <Film className="size-7" />
              ) : (
                <ImageOff className="size-7" />
              )}
            </span>
          )}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1F1712]/35 to-transparent"
          />

          {watermark && !midia.previaMarcada ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
            >
              <span className="-rotate-12 text-[9px] font-semibold uppercase tracking-[0.32em] text-white/55 drop-shadow">
                {watermarkText ?? 'prévia'}
              </span>
            </span>
          ) : null}

          {numeroVisivel ? (
            <span
              aria-label={`Foto ${midia.numero}`}
              title={`Foto ${formatarNumeroFoto(midia.numero)}`}
              className="absolute left-2 top-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#201A15]/55 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-white shadow-sm backdrop-blur"
            >
              {formatarNumeroFoto(midia.numero)}
            </span>
          ) : null}

          {isVideo ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#201A15]/60 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur">
              <PlayCircle className="size-3" />
              vídeo
            </span>
          ) : null}

          {locked ? (
            <span
              aria-label="Mídia já entregue"
              title="Mídia já entregue"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#2D241C]/80 text-white shadow-sm"
            >
              <Lock className="size-3.5" />
            </span>
          ) : selected ? (
            <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/95 shadow ring-2 ring-[var(--gallery-accent)]">
              <Check
                className="size-4 text-[var(--gallery-accent)]"
                strokeWidth={3}
              />
            </span>
          ) : null}
        </span>
      </button>

      {onDownload ? (
        <button
          type="button"
          onClick={() => onDownload(midia)}
          aria-label={`Baixar ${midia.nomeArquivo}`}
          className="absolute bottom-3 right-14 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-[#2B241D] shadow-md backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Download className="size-4" />
        </button>
      ) : null}

      {onZoom ? (
        <button
          type="button"
          onClick={() => onZoom(midia)}
          aria-label={`Ampliar ${rotulo}`}
          className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-[#2B241D] shadow-md backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Maximize2 className="size-4" />
        </button>
      ) : null}
    </article>
  )
}
