import { Check, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { PacoteFotografico } from '@/domain/types'
import { cn } from '@/shared/lib/cn'
import { hexToRgba } from '@/shared/lib/colors'
import { formatBRL } from '@/shared/lib/currency'
import { formatDuration } from '@/shared/lib/date'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import {
  promocaoVigente,
  valorEfetivoPacote,
} from '@/features/packages/lib/pricing'

interface PackagePickerProps {
  value: string
  onChange: (pacote: PacoteFotografico) => void
  includeId?: string
  error?: string
}

export function PackagePicker({ value, onChange, includeId, error }: PackagePickerProps) {
  const pacotes = usePackageStore((state) => state.pacotes)
  const closeDrawer = useAgendaStore((state) => state.closeDrawer)
  const available = pacotes.filter((pacote) => pacote.ativo || pacote.id === includeId)

  return (
    <div className="space-y-1.5">
      {available.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-3 py-4 text-center">
          <Package className="mx-auto size-5 text-muted" />
          <p className="mt-2 text-xs font-medium text-ink">Nenhum pacote cadastrado</p>
          <p className="mt-0.5 text-[11px] text-muted">
            Cadastre um pacote na seção Pacotes para poder agendar.
          </p>
          <Link
            to="/pacotes"
            onClick={closeDrawer}
            className="mt-2 inline-flex text-[11px] font-semibold text-brand-700 transition hover:underline"
          >
            Ir para Pacotes
          </Link>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {available.map((pacote) => {
            const selected = pacote.id === value
            const temPromocao = promocaoVigente(pacote)
            const valor = valorEfetivoPacote(pacote, temPromocao)

            return (
              <button
                key={pacote.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(pacote)}
                className={cn(
                  'relative rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                  selected
                    ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-300'
                    : 'border-line bg-surface hover:border-slate-300 hover:bg-slate-50/60',
                )}
              >
                <span
                  className="absolute inset-x-3 top-0 h-1 rounded-b-full"
                  style={{ backgroundColor: pacote.corHex }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-2 pt-1">
                  <span
                    className="mt-0.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: pacote.corHex }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold leading-snug text-ink">
                      {pacote.nome}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {formatDuration(pacote.duracaoMinutos)} · {formatBRL(valor)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {pacote.quantidadeFotosInclusas} fotos
                      {pacote.quantidadeVideosInclusos > 0
                        ? ` · ${pacote.quantidadeVideosInclusos} vídeo${
                            pacote.quantidadeVideosInclusos === 1 ? '' : 's'
                          }`
                        : ''}
                      {temPromocao ? ' · promoção' : ''}
                    </span>
                  </span>
                  {selected ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </div>
                {!pacote.ativo ? (
                  <span
                    className="mt-2 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                    style={{ backgroundColor: hexToRgba('#64748b', 0.1) }}
                  >
                    Arquivado
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
