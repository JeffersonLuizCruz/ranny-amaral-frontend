import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  HardDrive,
  Images,
  Link2,
  Pencil,
  RotateCcw,
  Sparkles,
  Upload,
  Wallet,
} from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import { formatBytes } from '@/shared/lib/bytes'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { apiUrl } from '@/shared/api/httpClient'
import { prepararDownloadSelecao } from '@/features/galleries/api/galeriasApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { ExpurgoDialog } from '@/features/storage/components/ExpurgoDialog'
import { GalleryStatusBadges } from '@/features/galleries/components/GalleryStatusBadges'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { GalleryMediaUploader } from '@/features/galleries/components/GalleryMediaUploader'
import { GalleryEditedVersionDialog } from '@/features/galleries/components/GalleryEditedVersionDialog'
import { GalleryEditedBatchUploadDialog } from '@/features/galleries/components/GalleryEditedBatchUploadDialog'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import {
  menorValorFotoExtra,
  numerosDasFotosSelecionadas,
} from '@/features/galleries/lib/selection'

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function GalleryDetailPage() {
  const { galeriaId = '' } = useParams()
  const detalhe = useGalleryStore((state) => state.galeriaAtual)
  const midias = useGalleryStore((state) => state.midias)
  const carregando = useGalleryStore((state) => state.carregandoDetalhe)
  const carregarGaleria = useGalleryStore((state) => state.carregarGaleria)
  const removeMedia = useGalleryStore((state) => state.removeMedia)
  const publishSelection = useGalleryStore((state) => state.publishSelection)
  const reopenSelection = useGalleryStore((state) => state.reopenSelection)
  const confirmExtras = useGalleryStore((state) => state.confirmExtras)
  const waiveExtras = useGalleryStore((state) => state.waiveExtras)
  const releaseEditing = useGalleryStore((state) => state.releaseEditing)
  const publishDelivery = useGalleryStore((state) => state.publishDelivery)
  const revokeDelivery = useGalleryStore((state) => state.revokeDelivery)
  const liberarProntas = useGalleryStore((state) => state.liberarProntas)
  const liberarLote = useGalleryStore((state) => state.liberarLote)
  const revogarLiberacao = useGalleryStore((state) => state.revogarLiberacao)
  const renovarLink = useGalleryStore((state) => state.renovarLink)
  const definirAutoLiberacao = useGalleryStore(
    (state) => state.definirAutoLiberacao,
  )
  const alterarFinalidade = useGalleryStore((state) => state.alterarFinalidade)
  const addToast = useToastStore((state) => state.addToast)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const [editando, setEditando] = useState<MidiaGaleria | null>(null)
  const [loteEditadasOpen, setLoteEditadasOpen] = useState(false)
  const [baixandoSelecao, setBaixandoSelecao] = useState(false)
  const [expurgoOpen, setExpurgoOpen] = useState(false)
  const [filtroMidias, setFiltroMidias] = useState<
    'todas' | 'edicao' | 'prontas' | 'liberadas'
  >('todas')

  useEffect(() => {
    void carregarGaleria(galeriaId).catch(() => undefined)
  }, [carregarGaleria, galeriaId])

  const processando = midias.some(
    (midia) => midia.processamentoStatus === 'processando' || midia.editadaProcessando,
  )

  useEffect(() => {
    if (!processando) return
    let tentativas = 0
    const timer = window.setInterval(() => {
      tentativas += 1
      if (tentativas > 20) {
        window.clearInterval(timer)
        return
      }
      void carregarGaleria(galeriaId).catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [processando, carregarGaleria, galeriaId])

  if (carregando && !detalhe) {
    return <p className="p-10 text-center text-sm text-muted">Carregando galeria…</p>
  }

  if (!detalhe) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Images}
          title="Galeria não encontrada"
          description="Ela pode ter sido removida ou o link está incorreto."
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

  const galeria = detalhe.galeria
  const fotos = midias.filter((midia) => midia.tipo === 'foto')
  const videos = midias.filter((midia) => midia.tipo === 'video')
  const processadas = midias.filter((midia) => midia.processamentoStatus === 'disponivel')
  const podeEditarMidias = ['aguardando_upload', 'em_selecao'].includes(galeria.status)
  const podeEditarVersao = [
    'aguardando_upload',
    'em_selecao',
    'selecao_enviada',
    'em_edicao',
    'entregue',
  ].includes(galeria.status)
  const podeReabrirSelecao = ['em_selecao', 'selecao_enviada', 'em_edicao'].includes(
    galeria.status,
  )
  const selecionadas = new Set([
    ...(detalhe.selecao?.fotoIds ?? []),
    ...(detalhe.selecao?.videoIds ?? []),
  ])
  const selecionadasMidias = midias.filter((midia) => selecionadas.has(midia.id))
  const fotosSelecionadas = fotos.filter((midia) => selecionadas.has(midia.id))
  const numerosSelecionados = numerosDasFotosSelecionadas(
    fotos,
    detalhe.selecao?.fotoIds ?? [],
  )
  const selecaoEnviada = detalhe.selecao?.status === 'enviada'
  const midiaPronta = (midia: MidiaGaleria) => {
    if (midia.finalidade === 'pronta') {
      return midia.processamentoStatus === 'disponivel'
    }
    // Compatibilidade: galerias antigas podem ter RAW liberado. A UI de RAW foi
    // removida; o campo permanece apenas para leitura do estado legado.
    return midia.tipo === 'video'
      ? midia.processamentoStatus === 'disponivel'
      : Boolean(midia.editadaDisponivel || galeria.rawLiberado)
  }
  const aguardandoFinal = selecionadasMidias.filter((midia) => !midiaPronta(midia))
  const filaEdicao = aguardandoFinal.filter((midia) => midia.finalidade !== 'pronta')
  const emProcessamento = aguardandoFinal.filter((midia) => midia.finalidade === 'pronta')
  const prontas = selecionadasMidias.filter(midiaPronta)
  const liberadas = selecionadasMidias.filter((midia) => midia.liberadaEm)
  const naoLiberadas = selecionadasMidias.filter((midia) => !midia.liberadaEm)
  const prontasNaoLiberadas = prontas.filter((midia) => !midia.liberadaEm)
  const midiasNaoProntas = aguardandoFinal
  const fotosParaEditar = filaEdicao.filter((midia) => midia.tipo === 'foto')
  const fotosProntas = fotosSelecionadas.filter(midiaPronta)
  const midiasParaEdicao = midias.filter(
    (midia) => midia.finalidade !== 'pronta' && !midiaPronta(midia),
  )
  const midiasProntas = midias.filter(midiaPronta)
  const midiasLiberadas = midias.filter((midia) => midia.liberadaEm)
  const midiasFiltradas =
    filtroMidias === 'edicao'
      ? midiasParaEdicao
      : filtroMidias === 'prontas'
        ? midiasProntas
        : filtroMidias === 'liberadas'
          ? midiasLiberadas
          : midias
  const filtrosMidias = [
    { valor: 'todas' as const, rotulo: 'Todas', quantidade: midias.length },
    {
      valor: 'edicao' as const,
      rotulo: 'Para edição',
      quantidade: midiasParaEdicao.length,
    },
    { valor: 'prontas' as const, rotulo: 'Prontas', quantidade: midiasProntas.length },
    {
      valor: 'liberadas' as const,
      rotulo: 'Liberadas',
      quantidade: midiasLiberadas.length,
    },
  ]
  const entregaBloqueada =
    midiasNaoProntas.length > 0 ||
    naoLiberadas.some(
      (midia) => midiaPronta(midia) && !(midia.liberacaoAutomatica ?? true),
    )
  const linkCliente = galeria.tokenGaleria ?? galeria.tokenSelecao
  const pedidosExtras =
    detalhe.pedidosExtras ?? (detalhe.extras ? [detalhe.extras] : [])
  const pedidoPendente = pedidosExtras.find((pedido) => pedido.status === 'pendente')
  const liberacaoBloqueada = Boolean(pedidoPendente)

  const copiarLinkCliente = async () => {
    if (!linkCliente) return
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/galeria/${linkCliente}`,
      )
      addToast('Link do cliente copiado.')
    } catch {
      addToast('Não foi possível copiar o link.')
    }
  }

  const copiarNumeros = async () => {
    if (numerosSelecionados.length === 0) return
    try {
      await navigator.clipboard.writeText(
        numerosSelecionados.map(formatarNumeroFoto).join(', '),
      )
      addToast('Números das fotos copiados.')
    } catch {
      addToast('Não foi possível copiar os números.')
    }
  }

  const baixarSelecionadas = async () => {
    setBaixandoSelecao(true)
    try {
      const { url, quantidade } = await prepararDownloadSelecao(galeria.id)
      const anchor = document.createElement('a')
      anchor.href = apiUrl(url)
      anchor.download = `selecao-${detalhe.selecao?.protocolo ?? 'fotos'}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      addToast(`${quantidade} foto(s) selecionada(s) em download.`)
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setBaixandoSelecao(false)
    }
  }

  const executar = async (acao: () => Promise<unknown>, sucesso: string) => {
    try {
      await acao()
      addToast(sucesso)
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const reabrirSelecaoParaExtras = () => {
    const confirmado = window.confirm(
      'Reabrir a seleção para o cliente comprar extras?\n\n' +
        '• Pedidos de extras pendentes serão cancelados.\n' +
        '• Pedidos já pagos ou isentos são preservados e o novo pedido cobrará apenas a diferença.\n' +
        '• Fotos e vídeos já entregues continuam obrigatórios na nova seleção.\n' +
        '• Se já houver arquivos editados, eles são mantidos e as novas mídias precisarão de edição.',
    )
    if (!confirmado) return
    void executar(() => reopenSelection(galeria.id), 'Seleção reaberta.')
  }

  const alternarFinalidade = (midia: MidiaGaleria) => {
    if (!podeEditarMidias) return
    if (midia.finalidade === 'edicao' && midia.editadaDisponivel) {
      addToast('Remova a versão editada antes de marcar esta foto como pronta.')
      return
    }
    const nova = midia.finalidade === 'pronta' ? 'edicao' : 'pronta'
    const confirmado = window.confirm(
      nova === 'pronta'
        ? 'Marcar esta foto como já editada? Ela será liberada para download após a seleção.'
        : 'Marcar esta foto como original para edição?',
    )
    if (!confirmado) return
    void executar(
      () => alterarFinalidade(galeria.id, midia.id, nova),
      'Finalidade atualizada.',
    )
  }

  const remover = async (midia: MidiaGaleria) => {
    if (!window.confirm(`Remover "${midia.nomeArquivo}"?`)) return
    await executar(() => removeMedia(galeria.id, midia.id), 'Mídia removida.')
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link to="/galerias" className="mt-1 text-muted hover:text-ink">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Galeria
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {galeria.clienteNome ?? 'Reserva sem cliente'}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {detalhe.pacoteNome ?? 'Pacote removido'} ·{' '}
                {galeria.fotosInclusas ?? 0} fotos e {galeria.videosInclusos ?? 0}{' '}
                vídeos inclusos · extra{' '}
                {galeria.faixasFotoExtra && galeria.faixasFotoExtra.length > 0
                  ? `a partir de ${formatBRL(
                      menorValorFotoExtra(
                        galeria.valorFotoExtra ?? 0,
                        galeria.faixasFotoExtra,
                      ),
                    )}`
                  : formatBRL(galeria.valorFotoExtra ?? 0)}
              </p>
            </div>
          </div>
          <GalleryStatusBadges
            status={galeria.status}
            zipBaixadoEm={galeria.zipBaixadoEm}
            className="shrink-0 justify-end"
          />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Images className="size-4 text-brand-600" />
                Mídias
              </h3>
              <p className="mt-0.5 text-[11px] text-muted">
                {fotos.length} fotos · {videos.length} vídeos · {processadas.length}{' '}
                processadas
                {fotosSelecionadas.length > 0
                  ? ` · ${fotosProntas.length}/${fotosSelecionadas.length} prontas · ${filaEdicao.length} para editar${
                      emProcessamento.length > 0
                        ? ` · ${emProcessamento.length} processando`
                        : ''
                    }`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {podeEditarMidias ? (
                <>
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    label="Enviar para edição"
                    finalidade="edicao"
                  />
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    label="Enviar já editadas"
                    finalidade="pronta"
                  />
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {filtrosMidias.map((filtro) => (
              <button
                key={filtro.valor}
                type="button"
                aria-pressed={filtroMidias === filtro.valor}
                onClick={() => setFiltroMidias(filtro.valor)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition',
                  filtroMidias === filtro.valor
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-canvas/70 text-muted ring-line hover:text-ink',
                )}
              >
                {filtro.rotulo} ({filtro.quantidade})
              </button>
            ))}
          </div>

          <div className="mt-3">
            <GalleryMediaGrid
              midias={midiasFiltradas}
              selectedIds={selecionadas}
              numerarFotos
              onRemove={podeEditarMidias ? (midia) => void remover(midia) : undefined}
              onEdit={
                podeEditarVersao
                  ? (midia) => {
                      if (midia.finalidade === 'pronta') return
                      setEditando(midia)
                    }
                  : undefined
              }
              onChangeFinalidade={
                podeEditarMidias ? (midia) => alternarFinalidade(midia) : undefined
              }
            />
          </div>
        </section>

        {selecionadasMidias.length > 0 ? (
          <>
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Fila de edição</h3>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {filaEdicao.length} aguardando edição · {fotosProntas.length} de{' '}
                    {fotosSelecionadas.length} fotos prontas
                  </p>
                </div>
                {podeEditarVersao ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setLoteEditadasOpen(true)}
                    disabled={fotosParaEditar.length === 0}
                  >
                    <Upload className="size-3.5" />
                    Enviar editadas em lote ({fotosParaEditar.length})
                  </Button>
                ) : null}
              </div>

              {filaEdicao.length === 0 ? (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
                  {emProcessamento.length > 0
                    ? 'Nenhuma mídia aguardando edição. As fotos já editadas ainda estão sendo processadas.'
                    : 'Todas as mídias selecionadas já têm versão final.'}
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {filaEdicao.map((midia) => {
                    const processando = midia.processamentoStatus !== 'disponivel'
                    return (
                      <div
                        key={midia.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas/60 p-2.5"
                      >
                        {midia.thumbUrl || midia.webUrl || midia.editadaUrl ? (
                          <img
                            src={
                              midia.thumbUrl ??
                              midia.webUrl ??
                              midia.editadaUrl ??
                              undefined
                            }
                            alt={midia.nomeArquivo}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-muted">
                            <Images className="size-4" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium text-ink">
                            {midia.tipo === 'foto'
                              ? `${formatarNumeroFoto(midia.numero)} · `
                              : ''}
                            {midia.nomeArquivo}
                          </p>
                          <p className="text-[10px] text-muted">
                            {processando ? 'Processando original' : 'Precisa de edição'}
                          </p>
                        </div>
                        {podeEditarVersao && midia.tipo === 'foto' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={processando}
                            onClick={() => setEditando(midia)}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}

              {emProcessamento.length > 0 ? (
                <p className="mt-2 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
                  {emProcessamento.length} foto(s) já editadas ainda estão sendo
                  processadas. Elas entram em “Prontas para baixar” automaticamente.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Prontas para baixar
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {prontas.length} pronta(s) · {liberadas.length} liberada(s)
                    {prontasNaoLiberadas.length > 0
                      ? ` · ${prontasNaoLiberadas.length} aguardando liberação`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void executar(
                        () => liberarProntas(galeria.id),
                        'Mídias prontas liberadas.',
                      )
                    }
                    disabled={
                      prontasNaoLiberadas.length === 0 || liberacaoBloqueada
                    }
                  >
                    <Sparkles className="size-3.5" />
                    Liberar prontas ({prontasNaoLiberadas.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      void executar(
                        () => publishDelivery(galeria.id),
                        'Entrega finalizada.',
                      )
                    }
                    disabled={naoLiberadas.length > 0 || liberacaoBloqueada}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {galeria.status === 'entregue'
                      ? 'Entrega finalizada'
                      : 'Finalizar entrega'}
                  </Button>
                </div>
              </div>

              {liberacaoBloqueada ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                  Confirme ou isente os extras para liberar os downloads.
                </p>
              ) : prontas.length === 0 ? (
                <p className="mt-3 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
                  Nenhuma mídia pronta ainda. Envie as versões editadas ou cadastre
                  fotos já editadas.
                </p>
              ) : prontasNaoLiberadas.length > 0 ? (
                <p className="mt-2 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
                  Libere o lote para disponibilizar o download sem marca d'água.
                </p>
              ) : null}

              {!podeEditarMidias &&
              prontas.some((midia) => midia.finalidade === 'pronta') ? (
                <p className="mt-2 text-[10px] text-muted">
                  Para substituir uma foto já editada depois da seleção, reabra a
                  seleção primeiro.
                </p>
              ) : null}

              <div className="mt-3 space-y-2">
                {prontas.map((midia) => (
                  <div
                    key={midia.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas/60 p-2.5"
                  >
                    {midia.thumbUrl || midia.webUrl || midia.editadaUrl ? (
                      <img
                        src={
                          midia.thumbUrl ??
                          midia.webUrl ??
                          midia.editadaUrl ??
                          undefined
                        }
                        alt={midia.nomeArquivo}
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-muted">
                        <Images className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-ink">
                        {midia.tipo === 'foto'
                          ? `${formatarNumeroFoto(midia.numero)} · `
                          : ''}
                        {midia.nomeArquivo}
                      </p>
                      <p className="text-[10px] text-muted">
                        {midia.liberadaEm
                          ? 'Liberada para download'
                          : 'Pronta para liberar'}
                        {midia.tipo === 'video'
                          ? ' · vídeo original'
                          : midia.finalidade === 'pronta'
                            ? ' · já editada na origem'
                            : ' · versão editada recebida'}
                      </p>
                    </div>
                    {midia.tipo === 'foto' ? (
                      <label className="flex items-center gap-1 text-[10px] text-muted">
                        <input
                          type="checkbox"
                          checked={midia.liberacaoAutomatica ?? true}
                          onChange={(event) =>
                            void executar(
                              () =>
                                definirAutoLiberacao(
                                  galeria.id,
                                  midia.id,
                                  event.target.checked,
                                ),
                              'Auto-liberação atualizada.',
                            )
                          }
                          className="size-3.5 accent-brand-600"
                        />
                        auto
                      </label>
                    ) : null}
                    {midia.liberadaEm ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void executar(
                            () => revogarLiberacao(galeria.id, [midia.id]),
                            'Liberação revogada.',
                          )
                        }
                      >
                        <RotateCcw className="size-3.5" />
                        Revogar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={liberacaoBloqueada}
                        onClick={() =>
                          void executar(
                            () => liberarLote(galeria.id, [midia.id]),
                            'Mídia liberada.',
                          )
                        }
                      >
                        <Download className="size-3.5" />
                        Liberar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Link2 className="size-4 text-brand-600" />
              Seleção
            </h3>
            {linkCliente ? (
              <div className="mt-2 space-y-2 text-[11px] text-muted">
                <p>Link único do cliente · disponível até {formatDateTime(galeria.prazoSelecaoEm)}.</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void copiarLinkCliente()}
                  >
                    <Copy className="size-3.5" />
                    Copiar link do cliente
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void executar(() => renovarLink(galeria.id), 'Link renovado.')
                    }
                  >
                    <Sparkles className="size-3.5" />
                    Renovar
                  </Button>
                  {podeReabrirSelecao ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={reabrirSelecaoParaExtras}
                    >
                      <RotateCcw className="size-3.5" />
                      Reabrir
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-muted">
                  Publique o link quando o ensaio estiver realizado e os pagamentos quitados.
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    void executar(
                      () => publishSelection(galeria.id),
                      'Link de seleção publicado.',
                    )
                  }
                >
                  <Sparkles className="size-3.5" />
                  Publicar seleção
                </Button>
              </div>
            )}

            {galeria.status === 'entregue' ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                Para reabrir a seleção após a entrega, revogue primeiro o link de
                entrega. O cliente mantém os arquivos já baixados e só poderá
                acrescentar novas fotos.
              </p>
            ) : null}

            {detalhe.selecao ? (
              <div className="mt-3 rounded-xl bg-canvas/70 p-3 text-[11px] text-muted">
                <p>
                  Protocolo <strong className="text-ink">{detalhe.selecao.protocolo}</strong>
                </p>
                <p>
                  {detalhe.selecao.fotoIds.length} fotos e{' '}
                  {detalhe.selecao.videoIds.length} vídeos selecionados.
                </p>
                {numerosSelecionados.length > 0 ? (
                  <div className="mt-2">
                    <p className="font-medium text-ink">
                      Fotos selecionadas ({numerosSelecionados.length}):
                    </p>
                    <p className="mt-0.5 break-words font-semibold tracking-wide text-ink">
                      {numerosSelecionados.map(formatarNumeroFoto).join(', ')}
                    </p>
                  </div>
                ) : null}
                {detalhe.selecao.fotosExtras > 0 ? (
                  <p className="mt-1">
                    Extras: {detalhe.selecao.fotosExtras} fotos ·{' '}
                    {formatBRL(detalhe.selecao.valorExtras)}
                  </p>
                ) : null}
                {selecaoEnviada && numerosSelecionados.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void copiarNumeros()}
                    >
                      <Copy className="size-3.5" />
                      Copiar números
                    </Button>
                    <Button
                      size="sm"
                      disabled={baixandoSelecao}
                      onClick={() => void baixarSelecionadas()}
                    >
                      <Download className="size-3.5" />
                      {baixandoSelecao ? 'Preparando…' : 'Baixar selecionadas (.zip)'}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wallet className="size-4 text-brand-600" />
              Extras e edição
            </h3>
            {pedidosExtras.length > 0 ? (
              <div className="mt-2 space-y-3 text-[11px] text-muted">
                {detalhe.resumoExtras ? (
                  <div className="space-y-1 rounded-lg bg-canvas/70 px-2.5 py-2">
                    <p>
                      Coberto:{' '}
                      <strong className="text-ink">
                        {detalhe.resumoExtras.quantidadeCoberta} extra(s)
                      </strong>{' '}
                      · {formatBRL(detalhe.resumoExtras.valorCoberto)}
                    </p>
                    <p>
                      Pendente (a pagar):{' '}
                      <strong className="text-ink">
                        {detalhe.resumoExtras.quantidadePendente} extra(s)
                      </strong>{' '}
                      · {formatBRL(detalhe.resumoExtras.valorPendente)}
                    </p>
                    <p>
                      Total na seleção:{' '}
                      <strong className="text-ink">
                        {detalhe.resumoExtras.quantidadeTotal} extra(s)
                      </strong>{' '}
                      · {formatBRL(detalhe.resumoExtras.valorTotal)}
                    </p>
                  </div>
                ) : null}

                {pedidosExtras.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="rounded-xl border border-line bg-canvas/60 p-2.5"
                  >
                    <p>
                      <strong className="text-ink">
                        {pedido.quantidadeFotos} foto(s) extra(s)
                      </strong>{' '}
                      · {formatBRL(pedido.valorTotal)} · status{' '}
                      <strong className="text-ink">{pedido.status}</strong>
                    </p>
                    {pedido.detalhamento && pedido.detalhamento.length > 0 ? (
                      <p className="mt-0.5">
                        {pedido.detalhamento
                          .map(
                            (faixa) =>
                              `${faixa.quantidade} × ${formatBRL(faixa.valorUnitario)} = ${formatBRL(faixa.subtotal)}`,
                          )
                          .join(' · ')}
                      </p>
                    ) : null}
                    {pedido.liberacaoManual ? (
                      <p className="mt-0.5">
                        Liberado manualmente por {pedido.liberacaoManual.por}:{' '}
                        {pedido.liberacaoManual.motivo}
                      </p>
                    ) : null}
                  </div>
                ))}

                {pedidoPendente ? (
                  <div className="space-y-2">
                    <p>
                      Pix dos extras:{' '}
                      {pedidoPendente.chavePix ? (
                        <strong className="text-ink">{pedidoPendente.chavePix}</strong>
                      ) : (
                        'não configurada'
                      )}{' '}
                      ·{' '}
                      <Link
                        to="/contratos/configuracoes"
                        className="font-medium text-brand-700 hover:underline"
                      >
                        Configurar
                      </Link>
                    </p>
                    {pedidoPendente.comprovanteEnviadoEm ? (
                      <div className="rounded-xl border border-line bg-canvas/60 p-2.5">
                        <p className="text-ink">
                          Comprovante: {pedidoPendente.comprovanteNome ?? 'arquivo'}
                        </p>
                        <p className="mt-0.5 text-[10px]">
                          Enviado em {formatDateTime(pedidoPendente.comprovanteEnviadoEm)}.
                        </p>
                        {pedidoPendente.comprovanteUrl ? (
                          <a
                            href={pedidoPendente.comprovanteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            Baixar comprovante
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                        Aguardando o cliente enviar o comprovante Pix.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!pedidoPendente.comprovanteEnviadoEm}
                        onClick={() =>
                          void executar(
                            () => confirmExtras(galeria.id, 'pix'),
                            'Extras confirmados.',
                          )
                        }
                      >
                        <CheckCircle2 className="size-3.5" />
                        Confirmar Pix
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void executar(() => waiveExtras(galeria.id), 'Extras isentos.')
                        }
                      >
                        Isentar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const motivo = window.prompt('Motivo da liberação manual:')
                          if (motivo) {
                            void executar(
                              () => releaseEditing(galeria.id, motivo),
                              'Edição liberada manualmente.',
                            )
                          }
                        }}
                      >
                        Liberar manualmente
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted">
                Nenhum extra cobrado nesta seleção.
              </p>
            )}

          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Entrega</h3>
            {linkCliente ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void copiarLinkCliente()}
                >
                  <Copy className="size-3.5" />
                  Link do cliente
                </Button>
                {galeria.status === 'entregue' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void executar(() => revokeDelivery(galeria.id), 'Entrega revogada.')
                    }
                  >
                    Revogar
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {galeria.status === 'entregue'
              ? 'Entrega finalizada. O cliente baixa tudo pelo link único.'
              : liberadas.length > 0
                ? `${liberadas.length} mídia(s) liberadas para download pelo link único.`
                : 'Ainda não publicada. Libere as mídias prontas e finalize a entrega.'}
          </p>
          {galeria.zipBaixadoEm ? (
            <p className="mt-1 text-[11px] text-muted">
              Cliente baixou o ZIP em {formatDateTime(galeria.zipBaixadoEm)}.
            </p>
          ) : null}

          {entregaBloqueada ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
              {midiasNaoProntas.length > 0
                ? `${midiasNaoProntas.length} mídia(s) selecionada(s) ainda não têm versão final. Envie as versões editadas de todas as fotos selecionadas antes de finalizar.`
                : 'Há mídias prontas com auto-liberação desativada. Use “Liberar prontas” antes de finalizar.'}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <HardDrive className="size-4 text-brand-600" />
                Armazenamento
              </h3>
              <p className="mt-0.5 text-[11px] text-muted">
                {galeria.status === 'expurgada'
                  ? `Binários removidos${galeria.expurgoEfetivadoEm ? ` em ${formatDateTime(galeria.expurgoEfetivadoEm)}` : ''} · ${formatBytes(galeria.bytesExpurgados ?? 0)} liberados. Metadados e financeiro preservados.`
                  : galeria.zipConcluidoEm
                    ? `Cliente concluiu o ZIP em ${formatDateTime(galeria.zipConcluidoEm)}.`
                    : galeria.zipBaixadoEm
                      ? `ZIP iniciado em ${formatDateTime(galeria.zipBaixadoEm)}, sem conclusão registrada.`
                      : 'O expurgo fica disponível após o cliente concluir o download do ZIP.'}
              </p>
            </div>
            {isAdmin && galeria.status === 'entregue' ? (
              <Button size="sm" variant="secondary" onClick={() => setExpurgoOpen(true)}>
                <HardDrive className="size-3.5" />
                Expurgar binários
              </Button>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h3 className="text-sm font-semibold text-ink">Histórico</h3>
          <ul className="mt-2 space-y-1.5 text-[11px] text-muted">
            {detalhe.historico.map((evento) => (
              <li key={evento.id}>
                <span className="text-ink">{evento.tipo}</span>
                {evento.detalhe ? ` — ${evento.detalhe}` : ''} ·{' '}
                {formatDateTime(evento.em)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editando ? (
        <GalleryEditedVersionDialog
          open
          galeriaId={galeria.id}
          midia={midias.find((midia) => midia.id === editando.id) ?? editando}
          onClose={() => setEditando(null)}
        />
      ) : null}

      {loteEditadasOpen ? (
        <GalleryEditedBatchUploadDialog
          open
          galeriaId={galeria.id}
          fotos={fotosParaEditar}
          onClose={() => setLoteEditadasOpen(false)}
        />
      ) : null}

      {expurgoOpen ? (
        <ExpurgoDialog
          galeriaId={galeria.id}
          onClose={() => setExpurgoOpen(false)}
          onConcluido={() => {
            setExpurgoOpen(false)
            void carregarGaleria(galeriaId).catch(() => undefined)
          }}
        />
      ) : null}
    </div>
  )
}
