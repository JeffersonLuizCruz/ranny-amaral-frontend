import { useMemo } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Film,
  Images,
  Link2,
  Lock,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import type { MidiaGaleria } from '@/domain/galleries'
import { contarMidias } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Badge } from '@/shared/components/ui/Badge'
import { formatBRL } from '@/shared/lib/currency'
import { formatAppointmentDate } from '@/shared/lib/date'
import { useToastStore } from '@/shared/store/toastStore'
import { galleryIntegration } from '@/integrations/gallery'
import { removeGalleryMedia } from '@/integrations/gallery/mediaStorage'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { GalleryStatusBadge } from '@/features/galleries/components/GalleryStatusBadge'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { GalleryMediaUploader } from '@/features/galleries/components/GalleryMediaUploader'
import {
  contarSelecao,
  entregaExpirada,
  getCondicoesGaleria,
  podePublicarSelecao,
  selecaoExpirada,
} from '@/features/galleries/lib/selection'

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

export function GalleryDetailPage() {
  const { galeriaId = '' } = useParams()
  const galerias = useGalleryStore((state) => state.galerias)
  const publishSelection = useGalleryStore((state) => state.publishSelection)
  const reopenSelection = useGalleryStore((state) => state.reopenSelection)
  const confirmExtras = useGalleryStore((state) => state.confirmExtras)
  const waiveExtras = useGalleryStore((state) => state.waiveExtras)
  const releaseEditing = useGalleryStore((state) => state.releaseEditing)
  const startEditing = useGalleryStore((state) => state.startEditing)
  const markReadyForDelivery = useGalleryStore((state) => state.markReadyForDelivery)
  const publishDelivery = useGalleryStore((state) => state.publishDelivery)
  const revokeDelivery = useGalleryStore((state) => state.revokeDelivery)
  const cancelGallery = useGalleryStore((state) => state.cancelGallery)
  const removeMedia = useGalleryStore((state) => state.removeMedia)
  const appointments = useAppointmentStore((state) => state.appointments)
  const contratos = useContractStore((state) => state.contratos)
  const pacotes = usePackageStore((state) => state.pacotes)
  const clientes = useClientStore((state) => state.clientes)
  const addToast = useToastStore((state) => state.addToast)

  const galeria = galerias.find((item) => item.id === galeriaId)
  const appointment = galeria
    ? appointments.find((item) => item.id === galeria.agendamentoId)
    : undefined
  const contrato = galeria
    ? contratos.find(
        (item) =>
          item.id === galeria.contratoId ||
          item.agendamentoId === galeria.agendamentoId,
      )
    : undefined
  const pacote = appointment
    ? pacotes.find((item) => item.id === appointment.pacoteId)
    : undefined
  const cliente = appointment?.clienteId
    ? clientes.find((item) => item.id === appointment.clienteId)
    : undefined
  const nomeCliente =
    cliente?.nome ?? appointment?.contato?.nome ?? 'Reserva sem cliente'

  const condicoes = useMemo(
    () => getCondicoesGaleria(appointment, pacote),
    [appointment, pacote],
  )

  if (!galeria) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Images}
          title="Galeria não encontrada"
          description="Ela pode ter sido excluída ou o link está incorreto."
          action={
            <Link
              to="/galerias"
              className="inline-flex h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-medium text-white"
            >
              Voltar para galerias
            </Link>
          }
        />
      </div>
    )
  }

  const fotosOriginais = galeria.midias.filter(
    (midia) => midia.tipo === 'foto' && midia.status === 'original',
  )
  const videosOriginais = galeria.midias.filter(
    (midia) => midia.tipo === 'video' && midia.status === 'original',
  )
  const editadas = galeria.midias.filter((midia) => midia.status === 'editada')
  const selecionadas = galeria.midias.filter(
    (midia) =>
      galeria.selecao?.fotoIds.includes(midia.id) ||
      galeria.selecao?.videoIds.includes(midia.id),
  )
  const contagemSelecao = contarSelecao(galeria, fotosOriginais, videosOriginais)
  const gate = podePublicarSelecao({
    galeria,
    appointment,
    contrato,
    pacote,
  })
  const expirada = selecaoExpirada(galeria)
  const podeEditarMidias = ['aguardando_upload', 'em_selecao'].includes(galeria.status)
  const extrasResolvidos =
    !galeria.pedidoExtras ||
    ['pago', 'isento'].includes(galeria.pedidoExtras.status) ||
    Boolean(galeria.pedidoExtras.liberacaoManual)

  const handleCopySelectionLink = async () => {
    if (!galeria.tokenSelecao) return
    try {
      const url = galleryIntegration.buildSelectionUrl(galeria.tokenSelecao)
      await navigator.clipboard.writeText(url)
      addToast('Link de seleção copiado.')
    } catch {
      addToast('Não foi possível copiar o link de seleção.')
    }
  }

  const handleCopyDeliveryLink = async () => {
    if (!galeria.entrega?.token) return
    try {
      const url = galleryIntegration.buildDeliveryUrl(galeria.entrega.token)
      await navigator.clipboard.writeText(url)
      addToast('Link de entrega copiado.')
    } catch {
      addToast('Não foi possível copiar o link de entrega.')
    }
  }

  const handlePublishSelection = () => {
    if (!gate.ok) {
      addToast(gate.motivos[0] ?? 'Não foi possível publicar a seleção.')
      return
    }
    const token = publishSelection(galeria.id)
    if (!token) {
      addToast('Não foi possível publicar a seleção.')
      return
    }
    addToast('Link de seleção publicado por 30 dias.')
  }

  const handleReopen = () => {
    const ok = reopenSelection(galeria.id)
    if (!ok) {
      addToast('Não é possível reabrir esta seleção.')
      return
    }
    addToast('Link existente reaberto por mais 30 dias.')
  }

  const handleConfirmExtras = (forma: 'pix' | 'dinheiro') => {
    confirmExtras(galeria.id, forma)
    addToast(`Extras confirmados via ${forma}. Edição liberada.`)
  }

  const handleWaiveExtras = () => {
    if (!window.confirm('Marcar os extras como isentos?')) return
    waiveExtras(galeria.id)
    addToast('Extras isentos. Edição liberada.')
  }

  const handleRelease = () => {
    const motivo = window.prompt(
      'Motivo da liberação manual da edição:',
      'Cliente pagará os extras na entrega.',
    )
    if (!motivo) return
    releaseEditing(galeria.id, motivo)
    addToast('Edição liberada manualmente.')
  }

  const handleStartEditing = () => {
    if (!startEditing(galeria.id)) {
      addToast('Resolva os extras pendentes antes de iniciar a edição.')
      return
    }
    addToast('Edição iniciada.')
  }

  const handleReady = () => {
    if (!markReadyForDelivery(galeria.id)) {
      addToast('Envie pelo menos um arquivo editado antes de marcar como pronta.')
      return
    }
    addToast('Galeria pronta para entrega.')
  }

  const handlePublishDelivery = () => {
    const token = publishDelivery(galeria.id)
    if (!token) {
      addToast('Não foi possível publicar a entrega. Verifique os extras.')
      return
    }
    addToast('Link de entrega publicado por 90 dias.')
  }

  const handleRemoveMedia = async (midia: MidiaGaleria) => {
    if (!window.confirm(`Remover ${midia.nomeArquivo}?`)) return
    try {
      await removeGalleryMedia(midia.arquivoKey)
      removeMedia(galeria.id, midia.id)
      addToast('Mídia removida.')
    } catch {
      addToast('Não foi possível remover a mídia.')
    }
  }

  const handleCancelGallery = () => {
    if (!window.confirm('Cancelar esta galeria?')) return
    cancelGallery(galeria.id)
    addToast('Galeria cancelada.')
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/galerias"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Galerias
          </Link>
          <span className="text-slate-300">/</span>
          <GalleryStatusBadge status={galeria.status} />
          <span className="text-xs text-muted">
            {appointment
              ? formatAppointmentDate(appointment.dataHoraInicio, appointment.dataHoraFim)
              : 'Ensaio não encontrado'}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {nomeCliente}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {pacote?.nome ?? 'Pacote removido'} · {condicoes.fotosInclusas} fotos ·{' '}
              {condicoes.videosInclusos} vídeos inclusos
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {galeria.tokenSelecao ? (
              <Button size="sm" variant="secondary" onClick={handleCopySelectionLink}>
                <Copy className="size-3.5" />
                Copiar link de seleção
              </Button>
            ) : null}
            {galeria.entrega?.status === 'disponivel' &&
            !entregaExpirada(galeria) ? (
              <Button size="sm" variant="secondary" onClick={handleCopyDeliveryLink}>
                <Link2 className="size-3.5" />
                Copiar link de entrega
              </Button>
            ) : null}
            {!['entregue', 'cancelada'].includes(galeria.status) ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleCancelGallery}
              >
                <Trash2 className="size-3.5" />
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Mídias originais</h3>
                <p className="mt-0.5 text-[11px] text-muted">
                  {fotosOriginais.length} fotos · {videosOriginais.length} vídeos
                </p>
              </div>
              {podeEditarMidias ? (
                <GalleryMediaUploader galleryId={galeria.id} />
              ) : (
                <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
                  <Lock className="size-3" />
                  Upload bloqueado após o envio da seleção
                </Badge>
              )}
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Fotos
              </p>
              <GalleryMediaGrid
                midias={fotosOriginais}
                onRemove={podeEditarMidias ? handleRemoveMedia : undefined}
                emptyLabel="Nenhuma foto original enviada."
              />
            </div>

            {videosOriginais.length > 0 || condicoes.videosInclusos > 0 ? (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Vídeos
                </p>
                <GalleryMediaGrid
                  midias={videosOriginais}
                  onRemove={podeEditarMidias ? handleRemoveMedia : undefined}
                  emptyLabel="Nenhum vídeo original enviado."
                />
              </div>
            ) : null}

            {!gate.ok ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <ShieldCheck className="size-3.5" />
                  Antes de publicar a seleção
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-amber-800">
                  {gate.motivos.map((motivo) => (
                    <li key={motivo}>· {motivo}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Seleção do cliente</h3>
                <p className="mt-0.5 text-[11px] text-muted">
                  {galeria.prazoSelecaoEm
                    ? expirada
                      ? `Link expirado em ${formatDate(galeria.prazoSelecaoEm)}`
                      : `Aberto até ${formatDate(galeria.prazoSelecaoEm)}`
                    : 'Link ainda não publicado'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {galeria.status === 'aguardando_upload' ? (
                  <Button
                    size="sm"
                    onClick={handlePublishSelection}
                    disabled={!gate.ok}
                  >
                    <PlayCircle className="size-3.5" />
                    Publicar seleção
                  </Button>
                ) : null}
                {['em_selecao', 'selecao_enviada'].includes(galeria.status) ? (
                  <Button size="sm" variant="secondary" onClick={handleReopen}>
                    <RotateCcw className="size-3.5" />
                    Reabrir link
                  </Button>
                ) : null}
                {galeria.status === 'selecao_enviada' && extrasResolvidos ? (
                  <Button size="sm" onClick={handleStartEditing}>
                    <CheckCircle2 className="size-3.5" />
                    Iniciar edição
                  </Button>
                ) : null}
              </div>
            </div>

            {galeria.selecao ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Fotos" value={`${contagemSelecao.fotos}`} />
                  <Stat label="Vídeos" value={`${contagemSelecao.videos}`} />
                  <Stat label="Extras" value={`${galeria.selecao.fotosExtras}`} />
                  <Stat
                    label="Valor extras"
                    value={formatBRL(galeria.selecao.valorExtras)}
                  />
                </div>

                <p className="text-[11px] text-muted">
                  Enviada em {formatDateTime(galeria.selecao.enviadaEm)}
                </p>

                <GalleryMediaGrid
                  midias={selecionadas}
                  emptyLabel="Nenhuma mídia selecionada."
                />
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-6 text-center">
                <Clock3 className="mx-auto size-5 text-muted" />
                <p className="mt-2 text-xs text-muted">
                  Aguardando o cliente enviar a seleção.
                </p>
              </div>
            )}
          </section>

          {galeria.pedidoExtras ? (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Fotos extras</h3>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {galeria.pedidoExtras.quantidadeFotos} foto(s) ×{' '}
                    {formatBRL(galeria.pedidoExtras.valorUnitario)} ={' '}
                    {formatBRL(galeria.pedidoExtras.valorTotal)}
                  </p>
                </div>
                <span
                  className={
                    galeria.pedidoExtras.status === 'pago'
                      ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200'
                      : galeria.pedidoExtras.status === 'isento'
                        ? 'rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200'
                        : galeria.pedidoExtras.status === 'cancelado'
                          ? 'rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200'
                          : 'rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200'
                  }
                >
                  {galeria.pedidoExtras.status === 'pago'
                    ? 'Pago'
                    : galeria.pedidoExtras.status === 'isento'
                      ? 'Isento'
                      : galeria.pedidoExtras.status === 'cancelado'
                        ? 'Cancelado'
                        : 'Pendente'}
                </span>
              </div>

              {galeria.pedidoExtras.status === 'pendente' ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" onClick={() => handleConfirmExtras('pix')}>
                    <Wallet className="size-3.5" />
                    Confirmar Pix
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleConfirmExtras('dinheiro')}
                  >
                    <Wallet className="size-3.5" />
                    Confirmar dinheiro
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleWaiveExtras}>
                    <Sparkles className="size-3.5" />
                    Isentar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleRelease}>
                    Liberar edição
                  </Button>
                </div>
              ) : null}

              {galeria.pedidoExtras.liberacaoManual ? (
                <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800 ring-1 ring-amber-200">
                  Edição liberada manualmente em{' '}
                  {formatDateTime(galeria.pedidoExtras.liberacaoManual.em)}:{' '}
                  {galeria.pedidoExtras.liberacaoManual.motivo}
                </p>
              ) : null}
            </section>
          ) : null}

          {['em_edicao', 'pronta_entrega', 'entregue'].includes(galeria.status) ? (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Edição e entrega</h3>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {editadas.length} arquivo(s) editado(s) enviados.
                  </p>
                </div>
                {galeria.status === 'em_edicao' ? (
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    edited
                    label="Enviar arquivos editados"
                  />
                ) : null}
              </div>

              <div className="mt-3">
                <GalleryMediaGrid
                  midias={editadas}
                  emptyLabel="Nenhum arquivo editado enviado."
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {galeria.status === 'em_edicao' ? (
                  <Button size="sm" onClick={handleReady}>
                    <CheckCircle2 className="size-3.5" />
                    Marcar pronta para entrega
                  </Button>
                ) : null}
                {galeria.status === 'pronta_entrega' ? (
                  <Button size="sm" onClick={handlePublishDelivery}>
                    <Link2 className="size-3.5" />
                    Publicar link de entrega
                  </Button>
                ) : null}
                {galeria.status === 'entregue' ? (
                  galeria.entrega?.status === 'disponivel' &&
                  !entregaExpirada(galeria) ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyDeliveryLink}
                      >
                        <Copy className="size-3.5" />
                        Copiar link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          if (!window.confirm('Revogar o link de entrega?')) return
                          revokeDelivery(galeria.id)
                          addToast('Link de entrega revogado.')
                        }}
                      >
                        Revogar link
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handlePublishDelivery}>
                      <RotateCcw className="size-3.5" />
                      Republicar entrega
                    </Button>
                  )
                ) : null}
              </div>

              {galeria.entrega ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Stat label="Downloads" value={`${galeria.entrega.quantidadeDownloads}`} />
                  <Stat
                    label="Primeiro download"
                    value={formatDateTime(galeria.entrega.primeiroDownloadEm)}
                  />
                  <Stat
                    label="Expira em"
                    value={formatDate(galeria.entrega.expiraEm)}
                  />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Resumo do pacote</h3>
            <dl className="mt-3 space-y-2 text-[11px]">
              <Row label="Pacote" value={pacote?.nome ?? '—'} />
              <Row label="Fotos inclusas" value={`${condicoes.fotosInclusas}`} />
              <Row label="Vídeos inclusos" value={`${condicoes.videosInclusos}`} />
              <Row label="Foto extra" value={formatBRL(condicoes.valorFotoExtra)} />
              <Row
                label="Valor do ensaio"
                value={formatBRL(appointment?.valorAcordado ?? 0)}
              />
              <Row
                label="Entrada"
                value={`${formatBRL(contrato?.valorEntrada ?? 0)} · ${
                  contrato?.statusPagamento ?? '—'
                }`}
              />
              <Row
                label="Saldo final"
                value={`${formatBRL(contrato?.saldoRestante ?? 0)} · ${
                  contrato?.statusPagamentoFinal ?? '—'
                }`}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Histórico</h3>
            <div className="mt-3 space-y-2">
              {[...galeria.historico].reverse().map((evento) => (
                <div key={evento.id} className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink">
                      {evento.detalhe ?? evento.tipo}
                    </p>
                    <p className="text-[10px] text-muted">{formatDateTime(evento.em)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Links</h3>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-muted">
                <Images className="size-3.5" />
                {galeria.tokenSelecao ? (
                  <Link
                    to={`/selecao/${galeria.tokenSelecao}`}
                    target="_blank"
                    className="min-w-0 flex-1 truncate font-medium text-brand-700 hover:underline"
                  >
                    {galleryIntegration.buildSelectionUrl(galeria.tokenSelecao)}
                  </Link>
                ) : (
                  <span>Seleção não publicada</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Download className="size-3.5" />
                {galeria.entrega?.token ? (
                  <Link
                    to={`/entrega/${galeria.entrega.token}`}
                    target="_blank"
                    className="min-w-0 flex-1 truncate font-medium text-brand-700 hover:underline"
                  >
                    {galleryIntegration.buildDeliveryUrl(galeria.entrega.token)}
                  </Link>
                ) : (
                  <span>Entrega não publicada</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Film className="size-3.5" />
                {contarMidias(galeria.midias, 'video')} vídeos no total
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas/70 px-3 py-2 ring-1 ring-line">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}
