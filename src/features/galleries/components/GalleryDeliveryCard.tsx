import { CheckCircle2, Sparkles } from 'lucide-react'

import type { GaleriaStatus } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface GalleryDeliveryCardProps {
  status: GaleriaStatus
  totalSelecionado: number
  totalPronto: number
  totalLiberado: number
  bloqueio?: 'edicao' | 'extras' | null
  onEntregar: () => void
}

export function GalleryDeliveryCard({
  status,
  totalSelecionado,
  totalPronto,
  totalLiberado,
  bloqueio = null,
  onEntregar,
}: GalleryDeliveryCardProps) {
  const entregue = status === 'entregue'
  const faltamProntas = Math.max(0, totalSelecionado - totalPronto)
  const faltamLiberar = Math.max(0, totalSelecionado - totalLiberado)
  const podeEntregar =
    status === 'em_edicao' && faltamProntas === 0 && bloqueio === null
  const percentual =
    totalSelecionado > 0 ? Math.round((totalPronto / totalSelecionado) * 100) : 0

  return (
    <section
      aria-label="Entrega"
      className="rounded-2xl border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CheckCircle2 className="size-4 text-brand-600" />
            Entrega
          </h3>
          <p className="mt-0.5 text-[11px] text-muted">
            {entregue
              ? 'Entrega publicada. O cliente baixa tudo pelo link único.'
              : 'As fotos finais são liberadas ao cliente automaticamente. Publique o link quando a seleção estiver completa.'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-semibold ring-1',
            entregue
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-slate-100 text-slate-600 ring-slate-200',
          )}
        >
          {entregue ? 'Publicada' : 'Aguardando entrega'}
        </span>
      </div>

      {entregue ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
          A seleção está travada. O link para enviar ao cliente fica no topo da
          página.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Indicador rotulo="Selecionadas" valor={totalSelecionado} />
            <Indicador rotulo="Com versão final" valor={totalPronto} />
            <Indicador rotulo="Já disponíveis" valor={totalLiberado} />
          </div>

          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  faltamProntas === 0 ? 'bg-emerald-500' : 'bg-brand-500',
                )}
                style={{ width: `${percentual}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              {faltamProntas === 0
                ? 'Todas as mídias selecionadas já têm versão final.'
                : `${faltamProntas} mídia(s) ainda em edição.`}
              {faltamLiberar > 0 && faltamProntas === 0
                ? ` ${faltamLiberar} será(ão) disponibilizada(s) ao entregar.`
                : ''}
            </p>
          </div>

          {bloqueio === 'extras' ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
              Confirme ou isente os extras pendentes antes de entregar.
            </p>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            onClick={onEntregar}
            disabled={!podeEntregar}
          >
            <Sparkles className="size-4" />
            {faltamProntas > 0
              ? `Faltam ${faltamProntas} mídia(s) em edição`
              : status === 'em_edicao'
                ? 'Entregar ao cliente'
                : 'Entrega indisponível'}
          </Button>

          <p className="flex items-center gap-1.5 text-[10px] text-muted">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
            A seleção será travada e as mídias entregues não poderão ser removidas.
          </p>
        </div>
      )}
    </section>
  )
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-canvas/70 px-2 py-2 text-center">
      <p className="text-sm font-semibold text-ink">{valor}</p>
      <p className="text-[9px] leading-tight text-muted">{rotulo}</p>
    </div>
  )
}
