import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  HardDrive,
  Images,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
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
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { copiarTexto } from '@/shared/lib/clipboard'
import { compartilharLink } from '@/shared/lib/share'
import { prepararDownloadSelecao } from '@/features/galleries/api/galeriasApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { ExpurgoDialog } from '@/features/storage/components/ExpurgoDialog'
import { GalleryStatusBadges } from '@/features/galleries/components/GalleryStatusBadges'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { GalleryMediaUploader } from '@/features/galleries/components/GalleryMediaUploader'
import { GalleryMediaRemoveDialog } from '@/features/galleries/components/GalleryMediaRemoveDialog'
import { GalleryEditedVersionDialog } from '@/features/galleries/components/GalleryEditedVersionDialog'
import { GalleryEditedBatchUploadDialog } from '@/features/galleries/components/GalleryEditedBatchUploadDialog'
import { GalleryClientLinkCard } from '@/features/galleries/components/GalleryClientLinkCard'
import { GalleryDeliveryCard } from '@/features/galleries/components/GalleryDeliveryCard'
import { GalleryDeliveryDialog } from '@/features/galleries/components/GalleryDeliveryDialog'
import { FOTO_ACCEPT, VIDEO_ACCEPT } from '@/features/galleries/lib/mediaFile'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import {
  menorValorFotoExtra,
  numerosDasFotosSelecionadas,
} from '@/features/galleries/lib/selection'

const LIMITE_GRADE_MOBILE = 24
const PASSO_GRADE = 48
const LIMITE_LISTA = 10
const PASSO_LISTA = 20
const LIMITE_PROCESSAMENTO_MS = 2 * 60 * 1000

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
  const removeMedias = useGalleryStore((state) => state.removeMedias)
  const reprocessarMidia = useGalleryStore((state) => state.reprocessarMidia)
  const reprocessarPendentes = useGalleryStore((state) => state.reprocessarPendentes)
  const publishSelection = useGalleryStore((state) => state.publishSelection)
  const reopenSelection = useGalleryStore((state) => state.reopenSelection)
  const confirmExtras = useGalleryStore((state) => state.confirmExtras)
  const waiveExtras = useGalleryStore((state) => state.waiveExtras)
  const releaseEditing = useGalleryStore((state) => state.releaseEditing)
  const revokeDelivery = useGalleryStore((state) => state.revokeDelivery)
  const renovarLink = useGalleryStore((state) => state.renovarLink)
  const alterarFinalidade = useGalleryStore((state) => state.alterarFinalidade)
  const addToast = useToastStore((state) => state.addToast)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const [editando, setEditando] = useState<MidiaGaleria | null>(null)
  const [midiaParaRemover, setMidiaParaRemover] = useState<MidiaGaleria | null>(null)
  const [removendoMidia, setRemovendoMidia] = useState(false)
  const [removerLoteOpen, setRemoverLoteOpen] = useState(false)
  const [removendoLote, setRemovendoLote] = useState(false)
  const [loteEditadasOpen, setLoteEditadasOpen] = useState(false)
  const [entregarOpen, setEntregarOpen] = useState(false)
  const [baixandoSelecao, setBaixandoSelecao] = useState(false)
  const [reprocessandoLote, setReprocessandoLote] = useState(false)
  const [expurgoOpen, setExpurgoOpen] = useState(false)
  const [filtroMidias, setFiltroMidias] = useState<
    'todas' | 'edicao' | 'prontas' | 'liberadas'
  >('todas')
  const [limiteMidias, setLimiteMidias] = useState(LIMITE_GRADE_MOBILE)
  const [limiteFila, setLimiteFila] = useState(LIMITE_LISTA)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    void carregarGaleria(galeriaId).catch(() => undefined)
  }, [carregarGaleria, galeriaId])

  useEffect(() => {
    setLimiteMidias(LIMITE_GRADE_MOBILE)
  }, [filtroMidias])

  const processando = midias.some(
    (midia) => midia.processamentoStatus === 'processando' || midia.editadaProcessando,
  )

  useEffect(() => {
    if (!processando) return
    let tentativas = 0
    let cancelado = false
    let timer: number | undefined

    const agendar = () => {
      if (cancelado) return
      // Mantém o acompanhamento sem parar em silêncio: as primeiras rodadas são
      // rápidas e depois espaçam para não sobrecarregar a API.
      const espera = tentativas < 10 ? 3000 : 15000
      timer = window.setTimeout(() => {
        tentativas += 1
        if (document.visibilityState === 'visible') {
          void carregarGaleria(galeriaId).catch(() => undefined)
        }
        agendar()
      }, espera)
    }

    agendar()
    return () => {
      cancelado = true
      if (timer) window.clearTimeout(timer)
    }
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
  const pendentesReprocessamento = fotos.filter((midia) => {
    if (midia.processamentoStatus === 'falha') return true
    if (midia.processamentoStatus !== 'processando') return false
    const inicio = new Date(midia.uploadedAt).getTime()
    return Number.isFinite(inicio) && Date.now() - inicio > LIMITE_PROCESSAMENTO_MS
  })
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
      rotulo: 'Disponíveis',
      quantidade: midiasLiberadas.length,
    },
  ]
  const midiasVisiveis = isDesktop
    ? midiasFiltradas
    : midiasFiltradas.slice(0, limiteMidias)
  const restantesMidias = midiasFiltradas.length - midiasVisiveis.length
  const filaVisivel = filaEdicao.slice(0, limiteFila)
  const restantesFila = filaEdicao.length - filaVisivel.length
  const linkCliente = galeria.tokenGaleria ?? galeria.tokenSelecao
  const pedidosExtras =
    detalhe.pedidosExtras ?? (detalhe.extras ? [detalhe.extras] : [])
  const pedidoPendente = pedidosExtras.find((pedido) => pedido.status === 'pendente')
  const liberacaoBloqueada = Boolean(pedidoPendente)

  const urlCliente = (token: string) => `${window.location.origin}/galeria/${token}`

  const copiarLinkCliente = async () => {
    if (!linkCliente) return
    const url = urlCliente(linkCliente)
    if (await copiarTexto(url)) {
      addToast('Link do cliente copiado.')
      return
    }
    addToast('Não foi possível copiar o link.')
    window.prompt('Copie o link do cliente:', url)
  }

  const compartilharLinkCliente = async () => {
    if (!linkCliente) return
    const titulo =
      galeria.status === 'entregue'
        ? 'Sua galeria está pronta'
        : 'Escolha suas fotos favoritas'
    const status = await compartilharLink(titulo, urlCliente(linkCliente))
    if (status === 'copiado') addToast('Link copiado para compartilhar.')
    if (status === 'falhou') addToast('Não foi possível compartilhar o link.')
  }

  const copiarNumeros = async () => {
    if (numerosSelecionados.length === 0) return
    const texto = numerosSelecionados.map(formatarNumeroFoto).join(', ')
    if (await copiarTexto(texto)) {
      addToast('Números das fotos copiados.')
      return
    }
    addToast('Não foi possível copiar os números.')
    window.prompt('Copie os números das fotos:', texto)
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

  const confirmarRemocao = async () => {
    if (!midiaParaRemover || removendoMidia) return
    setRemovendoMidia(true)
    try {
      await removeMedia(galeria.id, midiaParaRemover.id)
      addToast('Mídia removida.')
      setMidiaParaRemover(null)
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setRemovendoMidia(false)
    }
  }

  const confirmarRemocaoLote = async () => {
    if (removendoLote || fotos.length === 0) return
    setRemovendoLote(true)
    try {
      const resultado = await removeMedias(
        galeria.id,
        fotos.map((midia) => midia.id),
      )
      const liberado =
        resultado.bytesLiberados > 0
          ? ` (${formatBytes(resultado.bytesLiberados)} liberados)`
          : ''
      addToast(`${resultado.quantidadeRemovida} foto(s) removida(s)${liberado}.`)
      setRemoverLoteOpen(false)
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setRemovendoLote(false)
    }
  }

  const reprocessar = async (midia: MidiaGaleria) => {
    await executar(
      () => reprocessarMidia(galeria.id, midia.id),
      'Reprocessamento solicitado.',
    )
  }

  const reprocessarLote = async () => {
    if (pendentesReprocessamento.length === 0 || reprocessandoLote) return
    const confirmado = window.confirm(
      `Reprocessar ${pendentesReprocessamento.length} foto(s) presas em processamento ou com falha?`,
    )
    if (!confirmado) return
    setReprocessandoLote(true)
    try {
      const quantidade = await reprocessarPendentes(galeria.id)
      addToast(`${quantidade} foto(s) reenfileirada(s) para processamento.`)
      await carregarGaleria(galeria.id).catch(() => undefined)
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setReprocessandoLote(false)
    }
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
                vídeos inclusos
                {(galeria.videosInclusos ?? 0) > 0 ? ' (opcional)' : ''} · extra{' '}
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

      <GalleryClientLinkCard
        status={galeria.status}
        url={linkCliente ? urlCliente(linkCliente) : undefined}
        prazoEm={galeria.prazoSelecaoEm}
        baixadoEm={galeria.zipBaixadoEm}
        podeReabrirSelecao={podeReabrirSelecao}
        onPublicar={() =>
          void executar(
            () => publishSelection(galeria.id),
            'Link de seleção publicado.',
          )
        }
        onCopiar={() => void copiarLinkCliente()}
        onCompartilhar={() => void compartilharLinkCliente()}
        onRenovar={() =>
          void executar(() => renovarLink(galeria.id), 'Link renovado.')
        }
        onRevogar={() =>
          void executar(() => revokeDelivery(galeria.id), 'Entrega revogada.')
        }
        onReabrir={reabrirSelecaoParaExtras}
      />

      <div className="space-y-4 p-4 sm:p-6">
        {selecionadasMidias.length > 0 ? (
          <GalleryDeliveryCard
            status={galeria.status}
            totalSelecionado={selecionadasMidias.length}
            totalPronto={prontas.length}
            totalLiberado={liberadas.length}
            bloqueio={
              midiasNaoProntas.length > 0
                ? 'edicao'
                : liberacaoBloqueada
                  ? 'extras'
                  : null
            }
            onEntregar={() => setEntregarOpen(true)}
          />
        ) : null}

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Images className="size-4 text-brand-600" />
                Mídias
              </h3>
              <p className="mt-0.5 text-[11px] text-muted">
                {fotos.length} fotos · {videos.length} vídeos enviados ·{' '}
                {galeria.videosInclusos ?? 0} inclusos · {processadas.length} processadas
                {fotosSelecionadas.length > 0
                  ? ` · ${fotosProntas.length}/${fotosSelecionadas.length} prontas · ${filaEdicao.length} para editar${
                      emProcessamento.length > 0
                        ? ` · ${emProcessamento.length} processando`
                        : ''
                    }`
                  : ''}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                Fotos: JPEG/PNG/WebP até 50 MB. Vídeos: MP4/MOV até 500 MB, entregues
                como original, sem edição.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pendentesReprocessamento.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => void reprocessarLote()}
                  disabled={reprocessandoLote}
                >
                  {reprocessandoLote ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {reprocessandoLote
                    ? 'Reprocessando…'
                    : `Reprocessar ${pendentesReprocessamento.length} ${
                        pendentesReprocessamento.length === 1
                          ? 'pendente'
                          : 'pendentes'
                      }`}
                </Button>
              ) : null}
              {podeEditarMidias ? (
                <>
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    label="Enviar fotos"
                    finalidade="edicao"
                    tipo="foto"
                    accept={FOTO_ACCEPT}
                  />
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    label="Enviar vídeo"
                    finalidade="edicao"
                    tipo="video"
                    accept={VIDEO_ACCEPT}
                    disabled={(galeria.videosInclusos ?? 0) <= 0}
                  />
                  <GalleryMediaUploader
                    galleryId={galeria.id}
                    label="Enviar já editadas"
                    finalidade="pronta"
                    tipo="foto"
                    accept={FOTO_ACCEPT}
                  />
                  {fotos.length > 0 ? (
                    <Button
                      variant="danger"
                      onClick={() => setRemoverLoteOpen(true)}
                      disabled={removendoLote}
                    >
                      {removendoLote ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Remover todas as fotos ({fotos.length})
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {podeEditarMidias && (galeria.videosInclusos ?? 0) <= 0 ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
              Esta galeria não tem vídeo incluso no pacote; o envio de vídeo está
              desabilitado.
            </p>
          ) : null}

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
              midias={midiasVisiveis}
              selectedIds={selecionadas}
              numerarFotos
              onRemove={
                podeEditarMidias ? (midia) => setMidiaParaRemover(midia) : undefined
              }
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
              onReprocessar={(midia) => void reprocessar(midia)}
            />
            {restantesMidias > 0 ? (
              <div className="mt-3 flex justify-center lg:hidden">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setLimiteMidias((valor) => valor + PASSO_GRADE)}
                >
                  <ChevronDown className="size-4" />
                  Ver mais fotos ({restantesMidias} restantes)
                </Button>
              </div>
            ) : !isDesktop && midiasFiltradas.length > LIMITE_GRADE_MOBILE ? (
              <div className="mt-3 flex justify-center lg:hidden">
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setLimiteMidias(LIMITE_GRADE_MOBILE)}
                >
                  <ChevronUp className="size-4" />
                  Mostrar menos
                </Button>
              </div>
            ) : null}
          </div>

          {!podeEditarMidias &&
          prontas.some((midia) => midia.finalidade === 'pronta') ? (
            <p className="mt-2 text-[10px] text-muted">
              Para substituir uma foto já editada depois da seleção, reabra a
              seleção primeiro.
            </p>
          ) : null}
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
                  {filaVisivel.map((midia) => {
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

              {filaEdicao.length > LIMITE_LISTA ? (
                <div className="mt-2 flex justify-center">
                  {restantesFila > 0 ? (
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => setLimiteFila((valor) => valor + PASSO_LISTA)}
                    >
                      <ChevronDown className="size-4" />
                      Ver mais ({restantesFila} restantes)
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => setLimiteFila(LIMITE_LISTA)}
                    >
                      <ChevronUp className="size-4" />
                      Mostrar menos
                    </Button>
                  )}
                </div>
              ) : null}

              {emProcessamento.length > 0 ? (
                <p className="mt-2 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
                  {emProcessamento.length} foto(s) já editadas ainda estão sendo
                  processadas. Elas são liberadas ao cliente automaticamente quando o
                  processamento termina.
                </p>
              ) : null}
            </section>

          </>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Images className="size-4 text-brand-600" />
              Seleção do cliente
            </h3>

            {galeria.status === 'entregue' ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                Para reabrir a seleção após a entrega, use “Revogar entrega” no
                menu do link do cliente. O cliente mantém os arquivos já baixados
                e só poderá acrescentar novas fotos.
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
            ) : (
              <p className="mt-2 text-[11px] text-muted">
                Nenhuma seleção registrada ainda.
              </p>
            )}
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

        {isAdmin ? (
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
        ) : null}
      </div>

      {entregarOpen ? (
        <GalleryDeliveryDialog
          open
          onClose={() => setEntregarOpen(false)}
          galeriaId={galeria.id}
          totalSelecionado={selecionadasMidias.length}
          totalPronto={prontas.length}
          totalLiberado={liberadas.length}
          bloqueioExtras={liberacaoBloqueada}
          prontas={prontas}
        />
      ) : null}

      {midiaParaRemover ? (
        <GalleryMediaRemoveDialog
          open
          midias={[midiaParaRemover]}
          selecaoRascunho={
            podeEditarMidias && detalhe.selecao?.status === 'rascunho'
          }
          removendo={removendoMidia}
          onClose={() => setMidiaParaRemover(null)}
          onConfirm={() => void confirmarRemocao()}
        />
      ) : null}

      {removerLoteOpen ? (
        <GalleryMediaRemoveDialog
          open
          midias={fotos}
          lote
          selecaoRascunho={
            podeEditarMidias && detalhe.selecao?.status === 'rascunho'
          }
          removendo={removendoLote}
          onClose={() => setRemoverLoteOpen(false)}
          onConfirm={() => void confirmarRemocaoLote()}
        />
      ) : null}

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
