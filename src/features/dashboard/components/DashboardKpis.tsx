import { CalendarDays, FileSignature, Images, Wallet } from 'lucide-react'

import type { DashboardResumo, FinanceiroResumo } from '@/features/dashboard/api/dashboardApi'
import { formatBRL } from '@/shared/lib/currency'

interface DashboardKpisProps {
  resumo: DashboardResumo
  financeiro: FinanceiroResumo
}

export function DashboardKpis({ resumo, financeiro }: DashboardKpisProps) {
  const cards = [
    {
      label: 'Ensaios hoje',
      value: String(resumo.ensaiosHoje),
      hint: `${resumo.ensaiosSemana} nos próximos 7 dias`,
      icon: CalendarDays,
      tone: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Contratos pendentes',
      value: String(resumo.contratosAguardandoAceite),
      hint: `${resumo.contratosEntradaPendente} com entrada · ${resumo.contratosSaldoPendente} com saldo final`,
      icon: FileSignature,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Galerias em produção',
      value: String(
        resumo.galeriasAguardandoEdicao + resumo.galeriasEmEdicao,
      ),
      hint: `${resumo.galeriasEmEdicao} em edição · ${resumo.galeriasAguardandoEdicao} com extras pendentes`,
      icon: Images,
      tone: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'A receber no mês',
      value: formatBRL(financeiro.totalAReceber),
      hint: `${financeiro.quantidadePendentes} pendência(s) financeira(s)`,
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <section
            key={card.label}
            className="rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{card.hint}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${card.tone}`}>
                <Icon className="size-4" />
              </span>
            </div>
          </section>
        )
      })}
    </div>
  )
}
