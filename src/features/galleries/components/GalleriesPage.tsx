import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Images, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { GaleriaStatus } from '@/domain/galleries'
import { GALERIA_STATUS_META, GALERIA_STATUS_ORDER } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { Paginador } from '@/shared/components/ui/Paginador'
import { cn } from '@/shared/lib/cn'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { GalleryStatusBadge } from '@/features/galleries/components/GalleryStatusBadge'
import { CreateGalleryDialog } from '@/features/galleries/components/CreateGalleryDialog'

type FiltroStatus = 'todas' | GaleriaStatus

export function GalleriesPage() {
  const galerias = useGalleryStore((state) => state.galerias)
  const paginaGalerias = useGalleryStore((state) => state.paginaGalerias)
  const carregando = useGalleryStore((state) => state.carregando)
  const erro = useGalleryStore((state) => state.erro)
  const carregarGalerias = useGalleryStore((state) => state.carregarGalerias)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<FiltroStatus>('todas')
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(12)
  const [creating, setCreating] = useState(false)
  const queryDebounced = useDebouncedValue(query)

  useEffect(() => {
    void carregarGalerias({
      status,
      q: queryDebounced.trim() || undefined,
      pagina,
      tamanho,
    }).catch(() => undefined)
  }, [carregarGalerias, pagina, queryDebounced, status, tamanho])

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Galerias</h2>
            <p className="mt-0.5 text-xs text-muted">
              {paginaGalerias?.totalItens ?? 0}{' '}
              {(paginaGalerias?.totalItens ?? 0) === 1 ? 'galeria' : 'galerias'}
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nova galeria
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPagina(0)
              }}
              placeholder="Buscar por cliente"
              className={cn(inputClass, 'pl-10')}
              aria-label="Buscar galeria por cliente"
            />
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            <FilterChip
              active={status === 'todas'}
              onClick={() => {
                setStatus('todas')
                setPagina(0)
              }}
            >
              Todas
            </FilterChip>
            {GALERIA_STATUS_ORDER.map((item) => (
              <FilterChip
                key={item}
                active={status === item}
                onClick={() => {
                  setStatus(item)
                  setPagina(0)
                }}
              >
                {GALERIA_STATUS_META[item].label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {erro ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </p>
        ) : null}

        {carregando && !paginaGalerias ? (
          <p className="py-10 text-center text-sm text-muted">Carregando galerias…</p>
        ) : galerias.length === 0 ? (
          <EmptyState
            icon={Images}
            title={query.trim() ? 'Nenhuma galeria encontrada' : 'Nenhuma galeria criada'}
            description={
              query.trim()
                ? 'Tente ajustar a busca ou o filtro de status.'
                : 'Crie a primeira galeria a partir de um ensaio realizado.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Nova galeria
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {galerias.map((galeria) => (
                <Link
                  key={galeria.id}
                  to={`/galerias/${galeria.id}`}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {galeria.clienteNome ?? 'Reserva sem cliente'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {galeria.fotosInclusas ?? 0} fotos e {galeria.videosInclusos ?? 0}{' '}
                        vídeos inclusos
                      </p>
                    </div>
                    <GalleryStatusBadge status={galeria.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11px] text-muted">
                    <span>
                      <strong className="text-ink">
                        {galeria.totalFotos ?? galeria.midias.filter((m) => m.tipo === 'foto').length}
                      </strong>{' '}
                      fotos
                    </span>
                    <span>
                      <strong className="text-ink">
                        {galeria.totalVideos ?? galeria.midias.filter((m) => m.tipo === 'video').length}
                      </strong>{' '}
                      vídeos
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Paginador
              pagina={paginaGalerias?.pagina ?? pagina}
              tamanho={paginaGalerias?.tamanho ?? tamanho}
              totalItens={paginaGalerias?.totalItens ?? 0}
              totalPaginas={paginaGalerias?.totalPaginas ?? 0}
              temAnterior={paginaGalerias?.temAnterior ?? false}
              temProxima={paginaGalerias?.temProxima ?? false}
              carregando={carregando}
              onPaginaChange={setPagina}
              onTamanhoChange={(novo) => {
                setTamanho(novo)
                setPagina(0)
              }}
            />
          </>
        )}
      </div>

      <CreateGalleryDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition',
        active
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-surface text-muted ring-line hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
