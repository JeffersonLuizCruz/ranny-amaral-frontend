import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileSignature,
  Images,
  MapPin,
  StickyNote,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ACEITE_STATUS_META } from '@/domain/contracts'
import { origemLabel, STATUS_META } from '@/domain/constants'
import { GALERIA_STATUS_META, type GaleriaEnsaio } from '@/domain/galleries'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { StatusBadge } from '@/features/appointments/components/StatusBadge'
import {
  AceiteStatusBadge,
  EntradaStatusBadge,
  SaldoFinalStatusBadge,
} from '@/features/contracts/components/ContractStatusBadge'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { GalleryStatusBadges } from '@/features/galleries/components/GalleryStatusBadges'
import { listarGalerias as listarGaleriasApi } from '@/features/galleries/api/galeriasApi'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import {
  montarResumoCliente,
  STATUS_FINANCEIRO_META,
  type ResumoCliente,
} from '@/features/clients/lib/profile'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import {
  formatAppointmentDate,
  formatTimeRange,
} from '@/shared/lib/date'

function formatarData(iso?: string): string {
  if (!iso) return '—'
  const data = new Date(iso)
  if (!Number.isFinite(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(data)
}

function formatarDataHora(iso?: string): string {
  if (!iso) return '—'
  const data = new Date(iso)
  if (!Number.isFinite(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

export function ClientDetailPage() {
  const { clienteId = '' } = useParams()
  const navigate = useNavigate()
  const cliente = useClientStore((state) =>
    state.clientes.find((item) => item.id === clienteId),
  )
  const carregando = useClientStore((state) => state.carregando)
  const carregado = useClientStore((state) => state.carregado)
  const appointments = useAppointmentStore((state) => state.appointments)
  const contratos = useContractStore((state) => state.contratos)
  const galeriasStore = useGalleryStore((state) => state.galerias)
  const pacotes = usePackageStore((state) => state.pacotes)
  const openAppointmentDrawer = useAgendaStore(
    (state) => state.openAppointmentDrawer,
  )
  const [galeriasExtras, setGaleriasExtras] = useState<GaleriaEnsaio[]>([])

  useEffect(() => {
    if (!cliente) return
    let ativo = true

    listarGaleriasApi({ q: cliente.nome, tamanho: 100 })
      .then((pagina) => {
        if (ativo) setGaleriasExtras(pagina.itens)
      })
      .catch(() => undefined)

    return () => {
      ativo = false
    }
  }, [cliente?.id, cliente?.nome])

  const galerias = useMemo(() => {
    const mapa = new Map<string, GaleriaEnsaio>()
    for (const galeria of galeriasStore) mapa.set(galeria.id, galeria)
    for (const galeria of galeriasExtras) mapa.set(galeria.id, galeria)
    return [...mapa.values()]
  }, [galeriasExtras, galeriasStore])

  const resumo = useMemo(
    () =>
      cliente
        ? montarResumoCliente({
            cliente,
            appointments,
            contratos,
            galerias,
          })
        : null,
    [appointments, cliente, contratos, galerias],
  )

  const pacotesById = useMemo(
    () => new Map(pacotes.map((pacote) => [pacote.id, pacote])),
    [pacotes],
  )

  if (!cliente || !resumo) {
    return (
      <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          {carregando || !carregado ? (
            <div className="animate-pulse space-y-3">
              <div className="h-24 rounded-2xl bg-line/60" />
              <div className="h-40 rounded-2xl bg-line/60" />
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
              <p className="text-sm font-medium text-ink">Cliente não encontrado.</p>
              <Link
                to="/clientes"
                className="mt-2 inline-flex text-xs font-medium text-brand-700 hover:underline"
              >
                Voltar para clientes
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  const financeiro = STATUS_FINANCEIRO_META[resumo.statusFinanceiro]
  const ensaio = resumo.proximoEnsaio ?? resumo.ultimoEnsaio
  const pacoteDoEnsaio = ensaio ? pacotesById.get(ensaio.pacoteId) : undefined
  const contratoDoEnsaio = ensaio
    ? resumo.contratos.find(
        (contrato) =>
          contrato.agendamentoId === ensaio.id &&
          contrato.statusAceite !== 'cancelado',
      )
    : undefined
  const galeriaDoEnsaio = ensaio
    ? resumo.galerias.find((galeria) => galeria.agendamentoId === ensaio.id)
    : undefined

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        <h1 className="sr-only">Ficha do cliente</h1>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Contratado"
            valor={formatBRL(resumo.contratado)}
            icone={Wallet}
          />
          <Kpi
            rotulo="Recebido"
            valor={formatBRL(resumo.recebido)}
            tom="positivo"
            icone={Wallet}
          />
          <Kpi
            rotulo="Pendente"
            valor={formatBRL(resumo.pendente)}
            tom={resumo.pendente > 0 ? 'atencao' : undefined}
            icone={Wallet}
            detalhe={financeiro.label}
          />
          <Kpi
            rotulo="Ensaios"
            valor={String(resumo.totalEnsaios)}
            detalhe={`${resumo.ensaiosRealizados} realizados`}
            icone={CalendarDays}
          />
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {resumo.proximoEnsaio ? 'Próximo ensaio' : 'Último ensaio'}
              </p>
              {ensaio ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {formatAppointmentDate(
                      ensaio.dataHoraInicio,
                      ensaio.dataHoraFim,
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatTimeRange(
                        ensaio.dataHoraInicio,
                        ensaio.dataHoraFim,
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {ensaio.local}
                    </span>
                    {pacoteDoEnsaio ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: pacoteDoEnsaio.corHex }}
                        />
                        {pacoteDoEnsaio.nome}
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={ensaio.status} />
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  Nenhum ensaio registrado para este cliente.
                </p>
              )}
            </div>

            {ensaio ? (
              <div className="flex flex-wrap gap-1.5">
                {contratoDoEnsaio ? (
                  <Link
                    to={`/contratos/${contratoDoEnsaio.id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-full bg-surface px-3 text-xs font-medium text-ink ring-1 ring-line transition hover:bg-canvas"
                  >
                    Abrir contrato
                    <ChevronRight className="size-3.5" />
                  </Link>
                ) : null}
                {galeriaDoEnsaio ? (
                  <Link
                    to={`/galerias/${galeriaDoEnsaio.id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-50 px-3 text-xs font-medium text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
                  >
                    Abrir galeria
                    <ChevronRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wallet className="size-4 text-brand-600" />
              Financeiro
            </h2>
            <Badge className={financeiro.badge}>
              <span className={`size-1.5 rounded-full ${financeiro.dot}`} />
              {financeiro.label}
            </Badge>
          </div>

          {resumo.contratos.length > 0 ? (
            <div className="mt-3 space-y-2">
              {resumo.contratos.map((contrato) => (
                <Link
                  key={contrato.id}
                  to={`/contratos/${contrato.id}`}
                  className="block rounded-xl border border-line p-3 transition hover:border-slate-300 hover:bg-canvas/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {contrato.numero}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Emitido em {formatarData(contrato.dataEmissao)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <AceiteStatusBadge status={contrato.statusAceite} />
                        <EntradaStatusBadge
                          status={contrato.statusEntrada}
                          pagamento={contrato.pagamento}
                        />
                        <SaldoFinalStatusBadge status={contrato.statusSaldoFinal} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink">
                        {formatBRL(contrato.valorTotal)}
                      </p>
                      <p className="text-[11px] text-emerald-600">
                        Recebido {formatBRL(contrato.valorRecebido)}
                      </p>
                      {contrato.valorPendente > 0 ? (
                        <p className="text-[11px] font-medium text-amber-700">
                          Pendente {formatBRL(contrato.valorPendente)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              Nenhum contrato vinculado a este cliente.
            </p>
          )}

          {resumo.ensaiosSemContrato.length > 0 ? (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Ensaios sem contrato
              </p>
              <div className="mt-2 space-y-2">
                {resumo.ensaiosSemContrato.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-ink">
                        {formatarDataHora(appointment.dataHoraInicio)}
                      </p>
                      <p className="text-[11px] text-muted">
                        {STATUS_META[appointment.status].label} ·{' '}
                        {pacotesById.get(appointment.pacoteId)?.nome ?? 'Pacote'}
                      </p>
                    </div>
                    <div className="text-right text-[11px]">
                      <p className="font-semibold text-ink">
                        {formatBRL(appointment.valorAcordado)}
                      </p>
                      {appointment.valorPendente > 0 ? (
                        <p className="text-amber-700">
                          Pendente {formatBRL(appointment.valorPendente)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Images className="size-4 text-brand-600" />
            Galerias
          </h2>

          {resumo.galerias.length > 0 ? (
            <div className="mt-3 space-y-2">
              {resumo.galerias.map((galeria) => {
                const tokenPublico = galeria.tokenGaleria ?? galeria.tokenSelecao
                return (
                  <div
                    key={galeria.id}
                    className="rounded-xl border border-line p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: galeria.pacoteCorHex ?? '#94a3b8',
                            }}
                          />
                          {galeria.pacoteNome ?? 'Pacote removido'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          Criada em {formatarDataHora(galeria.createdAt)}
                        </p>
                      </div>
                      <GalleryStatusBadges
                        status={galeria.status}
                        zipBaixadoEm={galeria.zipBaixadoEm}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      {galeria.fotosSelecionadas
                        ? `${galeria.fotosProntas ?? 0}/${galeria.fotosSelecionadas} fotos prontas`
                        : `${galeria.totalFotos ?? 0} fotos`}
                      {galeria.totalVideos
                        ? ` · ${galeria.totalVideos} vídeos`
                        : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Link
                        to={`/galerias/${galeria.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-full bg-surface px-3 text-[11px] font-medium text-ink ring-1 ring-line transition hover:bg-canvas"
                      >
                        Abrir galeria
                        <ChevronRight className="size-3" />
                      </Link>
                      {tokenPublico ? (
                        <a
                          href={`/galeria/${tokenPublico}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-50 px-3 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
                        >
                          Link público
                          <ChevronRight className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              Nenhuma galeria criada para este cliente.
            </p>
          )}
        </section>

        <Historico
          resumo={resumo}
          pacotesById={pacotesById}
          onAbrirEnsaio={(appointmentId) => {
            openAppointmentDrawer(appointmentId)
            navigate('/agenda')
          }}
        />

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <StickyNote className="size-4 text-brand-600" />
            Dados e observações
          </h2>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <Dado
              rotulo="Documento"
              valor={
                cliente.documento
                  ? `${cliente.tipoDocumento?.toUpperCase() ?? 'DOC'}: ${cliente.documento}`
                  : 'Não informado'
              }
            />
            <Dado rotulo="Cidade" valor={cliente.cidade ?? 'Não informada'} />
            <Dado rotulo="Origem" valor={origemLabel(cliente.origem)} />
            <Dado rotulo="Cliente desde" valor={formatarData(cliente.createdAt)} />
            <Dado
              rotulo="Última atualização"
              valor={formatarDataHora(resumo.ultimaAtividade)}
            />
          </div>
          <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-xs leading-relaxed text-muted">
            {cliente.observacoes || 'Sem observações registradas.'}
          </p>
        </section>
      </div>
    </div>
  )
}

function Kpi({
  rotulo,
  valor,
  detalhe,
  tom,
  icone: Icone,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  tom?: 'positivo' | 'atencao'
  icone: LucideIcon
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {rotulo}
        </p>
        <Icone className="size-4 text-muted" />
      </div>
      <p
        className={
          tom === 'positivo'
            ? 'mt-2 text-xl font-semibold text-emerald-600'
            : tom === 'atencao'
              ? 'mt-2 text-xl font-semibold text-amber-700'
              : 'mt-2 text-xl font-semibold text-ink'
        }
      >
        {valor}
      </p>
      {detalhe ? <p className="mt-1 text-[11px] text-muted">{detalhe}</p> : null}
    </div>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {rotulo}
      </p>
      <p className="mt-0.5 text-ink">{valor}</p>
    </div>
  )
}

type EventoHistorico = {
  id: string
  em: string
  tipo: 'ensaio' | 'contrato' | 'galeria'
  titulo: string
  detalhe: string
  href?: string
  appointmentId?: string
}

function Historico({
  resumo,
  pacotesById,
  onAbrirEnsaio,
}: {
  resumo: ResumoCliente
  pacotesById: Map<string, { nome: string; corHex: string }>
  onAbrirEnsaio: (appointmentId: string) => void
}) {
  const eventos = useMemo<EventoHistorico[]>(() => {
    const itens: EventoHistorico[] = []

    for (const appointment of resumo.ensaios) {
      itens.push({
        id: `ensaio-${appointment.id}`,
        em: appointment.dataHoraInicio,
        tipo: 'ensaio',
        titulo: `Ensaio · ${
          pacotesById.get(appointment.pacoteId)?.nome ?? 'Pacote'
        }`,
        detalhe: STATUS_META[appointment.status].label,
        appointmentId: appointment.id,
      })
    }

    for (const contrato of resumo.contratos) {
      itens.push({
        id: `contrato-${contrato.id}`,
        em: contrato.dataEmissao,
        tipo: 'contrato',
        titulo: `Contrato ${contrato.numero}`,
        detalhe: ACEITE_STATUS_META[contrato.statusAceite].label,
        href: `/contratos/${contrato.id}`,
      })
    }

    for (const galeria of resumo.galerias) {
      itens.push({
        id: `galeria-${galeria.id}`,
        em: galeria.createdAt,
        tipo: 'galeria',
        titulo: `Galeria · ${galeria.pacoteNome ?? 'Pacote'}`,
        detalhe: GALERIA_STATUS_META[galeria.status].label,
        href: `/galerias/${galeria.id}`,
      })
    }

    return itens
      .sort((a, b) => Date.parse(b.em) - Date.parse(a.em))
      .slice(0, 12)
  }, [pacotesById, resumo])

  if (eventos.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Histórico</h2>
        <p className="mt-3 text-xs text-muted">
          Nenhuma atividade registrada ainda.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Histórico</h2>
        <span className="text-[11px] text-muted">últimos 12 eventos</span>
      </div>
      <ol className="mt-4 space-y-4 border-l border-line pl-4">
        {eventos.map((evento) => {
          const Icone =
            evento.tipo === 'ensaio'
              ? CalendarDays
              : evento.tipo === 'contrato'
                ? FileSignature
                : Images
          return (
            <li key={evento.id} className="relative">
              <span className="absolute -left-[26px] grid size-5 place-items-center rounded-full bg-canvas ring-1 ring-line">
                <Icone className="size-3 text-muted" />
              </span>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-ink">{evento.titulo}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {evento.detalhe} · {formatarDataHora(evento.em)}
                  </p>
                </div>
                {evento.href ? (
                  <Link
                    to={evento.href}
                    className="text-[11px] font-medium text-brand-700 hover:underline"
                  >
                    Abrir
                  </Link>
                ) : evento.appointmentId ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => onAbrirEnsaio(evento.appointmentId!)}
                  >
                    Abrir
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
