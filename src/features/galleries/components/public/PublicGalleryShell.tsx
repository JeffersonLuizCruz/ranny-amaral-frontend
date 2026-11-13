import type { CSSProperties, ReactNode } from 'react'

import { hexToRgba, isHexColor, normalizeHex } from '@/shared/lib/colors'

const DEFAULT_ACCENT = '#B08D57'

interface PublicGalleryShellProps {
  studioName?: string
  accent?: string
  children: ReactNode
}

/**
 * Moldura visual da galeria pública: fundo em camadas, acento do pacote e
 * header fixo. O acento chega como CSS variable para os demais componentes.
 */
export function PublicGalleryShell({
  studioName,
  accent,
  children,
}: PublicGalleryShellProps) {
  const safeAccent =
    accent && isHexColor(accent) ? normalizeHex(accent) : DEFAULT_ACCENT

  return (
    <div
      className="public-gallery relative min-h-dvh overflow-x-hidden bg-[#FBF7F2] text-[#2B241D]"
      style={{ '--gallery-accent': safeAccent } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -left-40 -top-52 size-[36rem] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(safeAccent, 0.18)} 0%, transparent 70%)`,
          }}
        />
        <div className="absolute -right-44 top-1/3 size-[32rem] rounded-full bg-[#E8D9C6]/40 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#F3E9DC] to-transparent" />
        <div className="public-grain absolute inset-0" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[#E7DCCD]/80 bg-[#FBF7F2]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-[var(--gallery-accent)]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[#2B241D]">
                {studioName ?? 'Photoizer CRM'}
              </p>
              <p className="text-[9px] uppercase tracking-[0.26em] text-[#9A8B7A]">
                Sua galeria
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-[#E7DCCD] bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8A7863] sm:inline-flex">
            seleção privada
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-44 pt-6 sm:px-6 sm:pb-32">
        {children}
      </main>
    </div>
  )
}
