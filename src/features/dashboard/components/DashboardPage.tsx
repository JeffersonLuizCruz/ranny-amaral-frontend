import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  buscarDashboard,
  type DashboardData,
  type Pendencia,
} from '@/features/dashboard/api/dashboardApi'
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { formatBRL } from '@/shared/lib/currency'

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const PRIORIDADE_CLASS: Record<Pendencia['prioridade'], string> = {
  ALTA: 'bg-red-50 text-red-700 ring-red-200',
  MEDIA: 'bg-amber-50 text-amber-700 ring-amber-200',
  BAIXA: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function DashboardPage() {
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      setDados(await buscarDashboard())
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  if (carregando && !dados) {
    return (
      <div className="grid min-h-[50dvh] place-items-center p-6">
        <span className="flex items-center gap-2 text-sm text-muted">
          <RefreshCw className="size-4 animate-spin" />
          Carregando visão geral…
        </span>
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={CalendarDays}
          title="Não foi possível carregar o dashboard"
          description={erro || 'Tente novamente em instantes.'}
          action={<Button onClick={() => void carregar()}>Tentar novamente</Button>}
        />
      </div>
    )
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="space-y-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Visão geral
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              O que precisa de atenção hoje
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              Atualizado em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCw className={carregando ? 'size-4 animate-spin' : 'size-4'} />
            Atualizar
          </Button>
        </header>

        <DashboardKpis resumo={dados.resumo} financeiro={dados.financeiroMes} />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays className="size-4 text-brand-600" />
                Próximos ensaios
              </h2>
              <Link
                to="/agenda"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
              >
                Ver agenda
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {dados.proximosEnsaios.length === 0 ? (
              <p className="mt-3 rounded-xl bg-canvas/60 px-3 py-6 text-center text-xs text-muted">
                Nenhum ensaio nos próximos dias.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {dados.proximosEnsaios.map((ensaio) => (
                  <li key={ensaio.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {ensaio.clienteNome ?? 'Reserva sem cliente'}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatDateTime(ensaio.inicio)} · {ensaio.status}
                      </p>
                    </div>
                    <Link
                      to="/agenda"
                      className="shrink-0 text-[11px] font-medium text-brand-700 hover:underline"
                    >
                      Abrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 className="size-4 text-brand-600" />
              Pendências
            </h2>

            {dados.pendencias.length === 0 ? (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-6 text-center text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Tudo em ordem por aqui.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dados.pendencias.map((pendencia) => (
                  <li key={`${pendencia.tipo}-${pendencia.titulo}`}>
                    <Link
                      to={pendencia.link}
                      className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas/40 px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50/60"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink">{pendencia.titulo}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{pendencia.descricao}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ${PRIORIDADE_CLASS[pendencia.prioridade]}`}
                      >
                        {pendencia.prioridade}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              Financeiro de {dados.financeiroMes.mes}
            </h2>
            <Link
              to="/financeiro"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
            >
              Ver financeiro
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ResumoFinanceiro label="Previsto" valor={dados.financeiroMes.totalPrevisto} />
            <ResumoFinanceiro label="Recebido" valor={dados.financeiroMes.totalRecebido} />
            <ResumoFinanceiro label="A receber" valor={dados.financeiroMes.totalAReceber} />
          </div>
          {dados.financeiroMes.quantidadeExtrasPendentes > 0 ? (
            <p className="mt-2 text-[11px] text-amber-700">
              {dados.financeiroMes.quantidadeExtrasPendentes} pedido(s) de extras aguardando
              confirmação.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

function ResumoFinanceiro({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-xl bg-canvas/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-ink">{formatBRL(valor)}</p>
    </div>
  )
}
