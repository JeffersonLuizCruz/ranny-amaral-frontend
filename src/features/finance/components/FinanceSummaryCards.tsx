import type { LucideIcon } from 'lucide-react'
import { CalendarCheck2, CheckCircle2, Clock3, Receipt } from 'lucide-react'

import type { FinanceSummary } from '@/features/finance/lib/summary'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'

interface FinanceSummaryCardsProps {
  summary: FinanceSummary
}

interface CardConfig {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  iconClass: string
}

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`
}

export function FinanceSummaryCards({ summary }: FinanceSummaryCardsProps) {
  const cards: CardConfig[] = [
    {
      label: 'Previsto no mês',
      value: formatBRL(summary.totalPrevisto),
      hint: pluralize(summary.quantidade, 'ensaio no mês', 'ensaios no mês'),
      icon: CalendarCheck2,
      iconClass: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Já recebido',
      value: formatBRL(summary.totalRecebido),
      hint: 'Entradas, saldos e extras confirmados',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'A receber',
      value: formatBRL(summary.totalAReceber),
      hint: `${summary.quantidadePendentes} entrada(s) · ${summary.quantidadeSaldosPendentes} saldo(s) · ${summary.quantidadeExtrasPendentes} extra(s)`,
      icon: Clock3,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Ticket médio',
      value: formatBRL(summary.ticketMedio),
      hint: 'Média por ensaio',
      icon: Receipt,
      iconClass: 'bg-slate-100 text-slate-600',
    },
  ]

  const progress = Math.min(100, Math.max(0, summary.percentualRecebido))

  const breakdown = [
    { label: 'Entradas recebidas', value: summary.totalEntradasRecebidas },
    { label: 'Saldos recebidos', value: summary.totalSaldosRecebidos },
    { label: 'Extras recebidos', value: summary.totalExtrasRecebidos },
    { label: 'Saldo + extras pendentes', value: summary.totalSaldos + summary.totalExtrasPendentes },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-line bg-surface p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-xl',
                    card.iconClass,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-muted">{card.hint}</p>
            </div>
          )
        })}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <p className="text-xs font-medium text-muted">Recebido no mês</p>
          <p className="text-xs font-semibold text-ink">
            {Math.round(summary.percentualRecebido)}% do previsto
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Percentual recebido do previsto"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-canvas/70 px-3 py-2 ring-1 ring-line"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {formatBRL(item.value)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
