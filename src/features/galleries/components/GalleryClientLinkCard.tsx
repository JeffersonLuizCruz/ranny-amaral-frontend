import { useEffect, useRef, useState } from 'react'
import {
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react'

import type { GaleriaStatus } from '@/domain/galleries'
import { formatDateTime } from '@/features/galleries/lib/format'
import { Button } from '@/shared/components/ui/Button'
import { buttonClasses } from '@/shared/components/ui/buttonStyles'
import { cn } from '@/shared/lib/cn'

interface GalleryClientLinkCardProps {
  status: GaleriaStatus
  url?: string
  prazoEm?: string
  baixadoEm?: string
  podeReabrirSelecao: boolean
  onPublicar: () => void
  onCopiar: () => void
  onCompartilhar: () => void
  onRenovar: () => void
  onRevogar: () => void
  onReabrir: () => void
}

export function GalleryClientLinkCard({
  status,
  url,
  prazoEm,
  baixadoEm,
  podeReabrirSelecao,
  onPublicar,
  onCopiar,
  onCompartilhar,
  onRenovar,
  onRevogar,
  onReabrir,
}: GalleryClientLinkCardProps) {
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const publicado = Boolean(url)
  const entregue = status === 'entregue'
  const expirado =
    publicado && Boolean(prazoEm) && new Date(prazoEm as string).getTime() < Date.now()
  const rotulo = !publicado
    ? 'Não publicado'
    : entregue
      ? 'Entregue'
      : expirado
        ? 'Expirado'
        : 'Seleção aberta'

  useEffect(() => {
    if (!menuAberto) return
    const aoClicarFora = (evento: MouseEvent) => {
      if (!menuRef.current?.contains(evento.target as Node)) setMenuAberto(false)
    }
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [menuAberto])

  const executarDoMenu = (acao: () => void) => {
    setMenuAberto(false)
    acao()
  }

  return (
    <section
      aria-label="Link do cliente"
      className="sticky top-0 z-20 border-b border-line bg-surface px-4 py-2.5 shadow-sm sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:px-6 lg:pb-0 lg:pt-4 lg:shadow-none"
    >
      <div className="lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-4 lg:shadow-card">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink sm:text-sm">
                <Link2 className="size-3.5 text-brand-600" />
                Link do cliente
              </h3>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                  !publicado
                    ? 'bg-slate-100 text-slate-600 ring-slate-200'
                    : entregue
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : expirado
                        ? 'bg-amber-50 text-amber-800 ring-amber-200'
                        : 'bg-brand-50 text-brand-700 ring-brand-200',
                )}
              >
                {rotulo}
              </span>
            </div>

            {publicado ? (
              <>
                <p className="mt-0.5 hidden truncate font-mono text-[11px] text-ink lg:block">
                  {url}
                </p>
                <p className="hidden text-[10px] text-muted lg:block">
                  {prazoEm ? `Válido até ${formatDateTime(prazoEm)}` : 'Sem prazo definido'}
                  {baixadoEm
                    ? ` · Cliente baixou o ZIP em ${formatDateTime(baixadoEm)}`
                    : ''}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-[11px] text-muted">
                Publique a seleção para gerar o link que o cliente vai receber.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            {publicado ? (
              <>
                <Button
                  size="lg"
                  onClick={onCopiar}
                  aria-label="Copiar link"
                >
                  <Copy className="size-4" />
                  <span className="hidden sm:inline">Copiar link</span>
                  <span className="sm:hidden">Copiar</span>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onCompartilhar}
                  aria-label="Enviar ao cliente"
                >
                  <Share2 className="size-4" />
                  <span className="hidden sm:inline">Enviar ao cliente</span>
                  <span className="sm:hidden">Enviar</span>
                </Button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir link do cliente"
                  title="Abrir link do cliente"
                  className={cn(buttonClasses('ghost', 'lg'), 'px-3 lg:px-5')}
                >
                  <ExternalLink className="size-4" />
                  <span className="hidden lg:inline">Abrir</span>
                </a>

                <div ref={menuRef} className="relative">
                  <Button
                    size="lg"
                    variant="ghost"
                    aria-label="Mais ações do link"
                    aria-haspopup="menu"
                    aria-expanded={menuAberto}
                    className="px-3 lg:px-5"
                    onClick={() => setMenuAberto((valor) => !valor)}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>

                  {menuAberto ? (
                    <div
                      role="menu"
                      aria-label="Mais ações do link"
                      className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-line bg-surface p-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => executarDoMenu(onRenovar)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-canvas"
                      >
                        <RefreshCw className="size-3.5 text-muted" />
                        Renovar link
                      </button>
                      {entregue ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => executarDoMenu(onRevogar)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-red-700 hover:bg-red-50"
                        >
                          <RotateCcw className="size-3.5" />
                          Revogar entrega
                        </button>
                      ) : null}
                      {podeReabrirSelecao ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => executarDoMenu(onReabrir)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-canvas"
                        >
                          <RotateCcw className="size-3.5 text-muted" />
                          Reabrir seleção
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <Button size="lg" onClick={onPublicar}>
                <Sparkles className="size-4" />
                Publicar seleção
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
