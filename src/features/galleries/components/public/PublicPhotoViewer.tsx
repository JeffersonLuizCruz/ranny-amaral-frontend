import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll'
import { cn } from '@/shared/lib/cn'

const MIN_SCALE = 1
const MAX_SCALE = 4

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

interface PublicPhotoViewerProps {
  midias: MidiaGaleria[]
  initialIndex: number
  selectedIds?: Set<string>
  lockedIds?: Set<string>
  onToggle?: (id: string) => void
  onClose: () => void
  watermark?: boolean
  watermarkText?: string
}

export function PublicPhotoViewer({
  midias,
  initialIndex,
  selectedIds,
  lockedIds,
  onToggle,
  onClose,
  watermark = false,
  watermarkText,
}: PublicPhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragStart = useRef<{
    x: number
    y: number
    originX: number
    originY: number
  } | null>(null)
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const [index, setIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(midias.length - 1, 0)),
  )
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useLockBodyScroll(true)

  const midia = midias[index]
  const isVideo = midia?.tipo === 'video'
  const selected = midia ? (selectedIds?.has(midia.id) ?? false) : false
  const locked = midia ? (lockedIds?.has(midia.id) ?? false) : false

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }

    return () => {
      if (dialog.open) {
        if (typeof dialog.close === 'function') dialog.close()
        else dialog.removeAttribute('open')
      }
      previousFocus.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setDragging(false)
    pointers.current.clear()
    dragStart.current = null
    pinchStart.current = null
    swipeStart.current = null
  }, [index])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setIndex((atual) => Math.max(0, atual - 1))
      } else if (event.key === 'ArrowRight') {
        setIndex((atual) => Math.min(midias.length - 1, atual + 1))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [midias.length])

  useEffect(() => {
    if (!midia || isVideo) return

    for (const vizinha of [midias[index - 1], midias[index + 1]]) {
      if (!vizinha || vizinha.tipo === 'video') continue
      const url = vizinha.webUrl ?? vizinha.thumbUrl
      if (!url) continue
      const image = new Image()
      image.src = url
    }
  }, [index, isVideo, midia, midias])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || isVideo) return

    const handler = (event: WheelEvent) => {
      event.preventDefault()
      setScale((atual) => {
        const proximo = clampScale(atual + (event.deltaY < 0 ? 0.3 : -0.3))
        if (proximo === MIN_SCALE) setOffset({ x: 0, y: 0 })
        return proximo
      })
    }

    stage.addEventListener('wheel', handler, { passive: false })
    return () => stage.removeEventListener('wheel', handler)
  }, [isVideo])

  if (!midia) return null

  const imageUrl =
    midia.webUrl ?? midia.editadaUrl ?? midia.thumbUrl ?? midia.originalUrl ?? null
  const videoUrl =
    midia.originalUrl ?? midia.webUrl ?? midia.thumbUrl ?? midia.editadaUrl ?? null

  const clampOffset = (x: number, y: number, nextScale: number) => {
    const stage = stageRef.current
    if (!stage || nextScale <= MIN_SCALE) return { x: 0, y: 0 }
    const maxX = (stage.clientWidth * (nextScale - 1)) / 2
    const maxY = (stage.clientHeight * (nextScale - 1)) / 2
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  const zoomTo = (value: number) => {
    const next = clampScale(value)
    setScale(next)
    if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
  }

  const irPara = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= midias.length) return
    setIndex(nextIndex)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isVideo) return
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointers.current.size === 1 && scale > MIN_SCALE) {
      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
        originX: offset.x,
        originY: offset.y,
      }
      setDragging(true)
    } else if (pointers.current.size === 1) {
      swipeStart.current = { x: event.clientX, y: event.clientY }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchStart.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
      }
      swipeStart.current = null
      setDragging(false)
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const next = clampScale(
        pinchStart.current.scale * (distance / pinchStart.current.distance),
      )
      setScale(next)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return
    }

    if (dragStart.current) {
      const nextX = dragStart.current.originX + event.clientX - dragStart.current.x
      const nextY = dragStart.current.originY + event.clientY - dragStart.current.y
      setOffset(clampOffset(nextX, nextY, scale))
    }
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)

    if (pointers.current.size === 0 && swipeStart.current) {
      const deltaX = event.clientX - swipeStart.current.x
      const deltaY = event.clientY - swipeStart.current.y
      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
        irPara(index + (deltaX < 0 ? 1 : -1))
      }
      swipeStart.current = null
    }

    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) {
      dragStart.current = null
      setDragging(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Visualizador da galeria"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="public-viewer fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-white outline-none"
    >
      <div className="relative flex h-dvh w-full flex-col bg-[#171310]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 pb-10 sm:p-5">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/90 ring-1 ring-white/15 backdrop-blur">
            {isVideo ? 'Vídeo' : `Foto ${formatarNumeroFoto(midia.numero)}`} ·{' '}
            {index + 1} de {midias.length}
          </span>

          <div className="flex items-center gap-1.5">
            {!isVideo ? (
              <>
                <ViewerButton
                  label="Reduzir zoom"
                  onClick={() => zoomTo(scale - 0.5)}
                  disabled={scale <= MIN_SCALE}
                >
                  <Minus className="size-4" />
                </ViewerButton>
                <ViewerButton
                  label="Aumentar zoom"
                  onClick={() => zoomTo(scale + 0.5)}
                  disabled={scale >= MAX_SCALE}
                >
                  <Plus className="size-4" />
                </ViewerButton>
                <ViewerButton
                  label="Restaurar zoom"
                  onClick={() => zoomTo(MIN_SCALE)}
                >
                  {scale > MIN_SCALE ? (
                    <RotateCcw className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </ViewerButton>
              </>
            ) : null}
            <ViewerButton label="Fechar visualizador" onClick={onClose}>
              <X className="size-4" />
            </ViewerButton>
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden px-2 pb-28 pt-20 sm:px-10"
          onDoubleClick={() => {
            if (!isVideo) zoomTo(scale > MIN_SCALE ? MIN_SCALE : 2)
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {isVideo && videoUrl ? (
            <video
              key={midia.id}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            />
          ) : imageUrl ? (
            <img
              key={midia.id}
              src={imageUrl}
              alt={midia.nomeArquivo}
              draggable={false}
              className={cn(
                'max-h-full max-w-full select-none object-contain shadow-2xl',
                dragging ? 'transition-none' : 'transition-transform duration-150',
              )}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              }}
            />
          ) : (
            <p className="text-sm text-white/70">Prévia indisponível.</p>
          )}

          {watermark && !midia.previaMarcada && !isVideo ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
            >
              <span className="-rotate-12 text-sm font-semibold uppercase tracking-[0.4em] text-white/15">
                {watermarkText ?? 'prévia'}
              </span>
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-12 sm:px-5">
          <ViewerButton
            label="Mídia anterior"
            onClick={() => irPara(index - 1)}
            disabled={index === 0}
          >
            <ChevronLeft className="size-5" />
          </ViewerButton>

          {onToggle ? (
            <button
              type="button"
              onClick={() => {
                if (!locked) onToggle(midia.id)
              }}
              disabled={locked}
              aria-pressed={selected}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition',
                selected
                  ? 'bg-[#FFFDF9] text-[#2B241D]'
                  : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25',
                locked && 'cursor-default opacity-70',
              )}
            >
              {locked ? (
                <Lock className="size-4" />
              ) : (
                <Check
                  className={cn('size-4', selected && 'text-[var(--gallery-accent)]')}
                  strokeWidth={3}
                />
              )}
              {locked
                ? 'Já entregue'
                : selected
                  ? 'Selecionada'
                  : `Selecionar ${isVideo ? 'vídeo' : 'foto'}`}
            </button>
          ) : null}

          <ViewerButton
            label="Próxima mídia"
            onClick={() => irPara(index + 1)}
            disabled={index === midias.length - 1}
          >
            <ChevronRight className="size-5" />
          </ViewerButton>
        </div>
      </div>
    </dialog>
  )
}

function ViewerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  )
}
