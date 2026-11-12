import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Boxes,
  Database,
  HardDrive,
  RefreshCw,
  ServerCog,
  Trash2,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import {
  coletarArmazenamento,
  listarGaleriasArmazenamento,
  obterResumoArmazenamento,
  reconciliarArmazenamento,
  type GaleriaArmazenamento,
  type ReconciliacaoArmazenamento,
  type ResumoArmazenamento,
} from '@/features/storage/api/armazenamentoApi'
import { ExpurgoDialog } from '@/features/storage/components/ExpurgoDialog'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { mensagemDeErro } from '@/shared/api/errors'
import { formatBytes } from '@/shared/lib/bytes'
import { cn } from '@/shared/lib/cn'
import { useToastStore } from '@/shared/store/toastStore'

function formatarData(valor?: string | null): string {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(valor))
}

const ALERTA_ESTILO: Record<string, string> = {
  OK: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ATENCAO: 'bg-amber-50 text-amber-800 ring-amber-200',
  CRITICO: 'bg-red-50 text-red-800 ring-red-200',
  INDISPONIVEL: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const ALERTA_TEXTO: Record<string, string> = {
  OK: 'Espaço saudável.',
  ATENCAO: 'O disco está acima do percentual de alerta.',
  CRITICO: 'O espaço livre chegou à reserva operacional. Expurgue galerias ou amplie o disco.',
  INDISPONIVEL: 'A medição do disco está indisponível. Configure o volume montado no backend.',
}

export function StoragePage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const addToast = useToastStore((state) => state.addToast)
  const [resumo, setResumo] = useState<ResumoArmazenamento | null>(null)
  const [galerias, setGalerias] = useState<GaleriaArmazenamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [reconciliacao, setReconciliacao] = useState<ReconciliacaoArmazenamento | null>(null)
  const [expurgo, setExpurgo] = useState<GaleriaArmazenamento | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [novoResumo, novasGalerias] = await Promise.all([
        obterResumoArmazenamento(),
        listarGaleriasArmazenamento(),
      ])
      setResumo(novoResumo)
      setGalerias(novasGalerias)
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const fila = useMemo(
    () => galerias.filter((galeria) => galeria.elegivel),
    [galerias],
  )
  const atencao = useMemo(
    () =>
      galerias.filter(
        (galeria) =>
          galeria.status === 'entregue' && !galeria.zipConcluidoEm,
      ),
    [galerias],
  )
  const expurgadas = useMemo(
    () => galerias.filter((galeria) => galeria.expurgoStatus === 'executado'),
    [galerias],
  )

  const coletar = async () => {
    setProcessando(true)
    try {
      await coletarArmazenamento()
      await carregar()
      addToast('Coleta de armazenamento atualizada.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setProcessando(false)
    }
  }

  const reconciliar = async () => {
    setProcessando(true)
    try {
      setReconciliacao(await reconciliarArmazenamento())
      addToast('Reconciliação concluída.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setProcessando(false)
    }
  }

  if (carregando && !resumo) {
    return <p className="p-10 text-center text-sm text-muted">Carregando armazenamento…</p>
  }

  if (erro && !resumo) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={HardDrive}
          title="Não foi possível carregar o armazenamento"
          description={erro}
          action={<Button onClick={() => void carregar()}>Tentar novamente</Button>}
        />
      </div>
    )
  }

  const total = resumo?.totalBytes ?? null
  const usado = resumo?.usadoBytes ?? null
  const percentual = resumo?.percentualUsado ?? 0
  const alerta = resumo?.alerta ?? 'INDISPONIVEL'

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Operação
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Armazenamento
            </h1>
            <p className="mt-0.5 text-[11px] text-muted">
              Disco da VPS compartilhado entre fotos, banco e infraestrutura.
              {resumo ? ` Última coleta em ${formatarData(resumo.coletadoEm)}.` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void carregar()}>
              <RefreshCw className="size-3.5" />
              Atualizar
            </Button>
            {isAdmin ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={processando}
                  onClick={() => void coletar()}
                >
                  <ServerCog className="size-3.5" />
                  Coletar agora
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={processando}
                  onClick={() => void reconciliar()}
                >
                  <Database className="size-3.5" />
                  Reconciliar
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <div
          className={cn(
            'flex items-start gap-2 rounded-2xl px-4 py-3 text-[11px] ring-1 ring-inset',
            ALERTA_ESTILO[alerta] ?? ALERTA_ESTILO.INDISPONIVEL,
          )}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{alerta}</p>
            <p>{ALERTA_TEXTO[alerta] ?? ALERTA_TEXTO.INDISPONIVEL}</p>
            {resumo?.diasRestantesEstimados !== null &&
            resumo?.diasRestantesEstimados !== undefined ? (
              <p className="mt-0.5">
                Estimativa: cerca de {resumo.diasRestantesEstimados} dia(s) até a reserva no
                ritmo atual.
              </p>
            ) : null}
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <HardDrive className="size-4 text-brand-600" />
                Disco
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatBytes(total)} no total · {formatBytes(usado)} usados ·{' '}
                {formatBytes(resumo?.livreBytes)} livres
              </p>
            </div>
            <p className="text-lg font-semibold text-ink">
              {resumo?.percentualUsado === null || resumo?.percentualUsado === undefined
                ? '—'
                : `${resumo.percentualUsado}%`}
            </p>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                percentual >= 90
                  ? 'bg-red-500'
                  : percentual >= 85
                    ? 'bg-amber-500'
                    : 'bg-brand-600',
              )}
              style={{ width: `${Math.min(100, Math.max(0, percentual))}%` }}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <Boxes className="size-3.5" /> CRM (storage + banco)
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatBytes(resumo?.crmBytes)}
              </p>
              <p className="text-[10px] text-muted">
                fotos e vídeos {formatBytes(resumo?.objetosBytes)} · banco{' '}
                {formatBytes(resumo?.postgresBytes)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <ServerCog className="size-3.5" /> Infraestrutura
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatBytes(resumo?.outrosBytes)}
              </p>
              <p className="text-[10px] text-muted">
                Coolify, Docker, logs e WAL — derivado do total
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <p className="text-[11px] font-medium text-muted">Reserva operacional</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatBytes(resumo?.reservaBytes)}
              </p>
              <p className="text-[10px] text-muted">
                disponível para fotos: {formatBytes(resumo?.disponivelParaFotosBytes)}
              </p>
            </div>
          </div>

          {resumo ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
              <span>originais {formatBytes(resumo.totais.originaisBytes)}</span>
              <span>editadas {formatBytes(resumo.totais.editadasBytes)}</span>
              <span>derivados {formatBytes(resumo.totais.derivadosBytes)}</span>
              <span>vídeos {formatBytes(resumo.totais.videosBytes)}</span>
              <span>comprovantes {formatBytes(resumo.totais.comprovantesBytes)}</span>
              <span>fonte: {resumo.origemColeta}</span>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Trash2 className="size-4 text-brand-600" />
                Fila de expurgo ({fila.length})
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Entregues com ZIP concluído. O expurgo remove apenas binários e é
                irreversível.
              </p>
            </div>
          </div>

          {fila.length === 0 ? (
            <p className="mt-3 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
              Nenhuma galeria elegível agora.
            </p>
          ) : (
            <TabelaGalerias
              galerias={fila}
              isAdmin={isAdmin}
              onExpurgar={setExpurgo}
            />
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">
            Atenção: entregues sem ZIP ({atencao.length})
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Só visibilidade. O expurgo continua dependendo do download concluído pelo
            cliente.
          </p>
          {atencao.length === 0 ? (
            <p className="mt-3 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
              Nenhuma galeria pendente de download.
            </p>
          ) : (
            <TabelaGalerias galerias={atencao} isAdmin={false} onExpurgar={setExpurgo} />
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Galeria por espaço</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            {galerias.length} galeria(s) · {expurgadas.length} expurgada(s).
          </p>
          <TabelaGalerias galerias={galerias} isAdmin={isAdmin} onExpurgar={setExpurgo} />
        </section>

        {reconciliacao ? (
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h2 className="text-sm font-semibold text-ink">Reconciliação</h2>
            <p className="mt-1 text-[11px] text-muted">
              {reconciliacao.objetosStorage} objeto(s) no bucket ·{' '}
              {reconciliacao.objetosCatalogo} no catálogo ·{' '}
              {reconciliacao.somenteStorage} só no bucket (
              {formatBytes(reconciliacao.bytesSomenteStorage)}) ·{' '}
              {reconciliacao.somenteCatalogo} só no catálogo.
            </p>
            {reconciliacao.amostraSomenteStorage.length > 0 ? (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-ink">Órfãos no storage:</p>
                <ul className="mt-1 space-y-0.5 text-[10px] text-muted">
                  {reconciliacao.amostraSomenteStorage.map((chave) => (
                    <li key={chave} className="break-all">
                      {chave}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {reconciliacao.amostraSomenteCatalogo.length > 0 ? (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-ink">Sem objeto no storage:</p>
                <ul className="mt-1 space-y-0.5 text-[10px] text-muted">
                  {reconciliacao.amostraSomenteCatalogo.map((chave) => (
                    <li key={chave} className="break-all">
                      {chave}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {expurgo ? (
        <ExpurgoDialog
          galeriaId={expurgo.galeriaId}
          onClose={() => setExpurgo(null)}
          onConcluido={() => {
            setExpurgo(null)
            void carregar()
          }}
        />
      ) : null}
    </div>
  )
}

function TabelaGalerias({
  galerias,
  isAdmin,
  onExpurgar,
}: {
  galerias: GaleriaArmazenamento[]
  isAdmin: boolean
  onExpurgar: (galeria: GaleriaArmazenamento) => void
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[46rem] text-left text-[11px]">
        <thead className="text-[10px] uppercase tracking-wide text-muted">
          <tr className="border-b border-line">
            <th className="py-2 pr-2 font-medium">Galeria</th>
            <th className="py-2 pr-2 font-medium">Status</th>
            <th className="py-2 pr-2 font-medium">ZIP</th>
            <th className="py-2 pr-2 text-right font-medium">Espaço</th>
            <th className="py-2 pr-2 font-medium">Situação</th>
            <th className="py-2 text-right font-medium">Ação</th>
          </tr>
        </thead>
        <tbody>
          {galerias.map((galeria) => (
            <tr key={galeria.galeriaId} className="border-b border-line/60">
              <td className="py-2 pr-2">
                <Link
                  to={`/galerias/${galeria.galeriaId}`}
                  className="font-medium text-ink hover:text-brand-700 hover:underline"
                >
                  {galeria.clienteNome ?? galeria.galeriaId}
                </Link>
              </td>
              <td className="py-2 pr-2 text-muted">{galeria.status}</td>
              <td className="py-2 pr-2 text-muted">
                {galeria.zipConcluidoEm
                  ? `concluído ${formatarData(galeria.zipConcluidoEm)}`
                  : galeria.zipBaixadoEm
                    ? `iniciado ${formatarData(galeria.zipBaixadoEm)}`
                    : '—'}
              </td>
              <td className="py-2 pr-2 text-right font-medium text-ink">
                {formatBytes(galeria.totalBytes)}
              </td>
              <td className="py-2 pr-2">
                {galeria.expurgoStatus === 'executado' ? (
                  <span className="text-muted">
                    expurgada · {formatBytes(galeria.bytesExpurgados)} liberados
                  </span>
                ) : galeria.elegivel ? (
                  <span className="font-medium text-emerald-700">elegível</span>
                ) : (
                  <span className="text-muted">{galeria.motivoBloqueio}</span>
                )}
              </td>
              <td className="py-2 text-right">
                {isAdmin && galeria.elegivel ? (
                  <Button size="sm" variant="ghost" onClick={() => onExpurgar(galeria)}>
                    Expurgar
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
