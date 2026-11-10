import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Images,
  Link2,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { formatBRL } from '@/shared/lib/currency'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { apiUrl } from '@/shared/api/httpClient'
import { prepararDownloadSelecao } from '@/features/galleries/api/galeriasApi'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { GalleryStatusBadge } from '@/features/galleries/components/GalleryStatusBadge'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { GalleryMediaUploader } from '@/features/galleries/components/GalleryMediaUploader'
import { GalleryEditedVersionDialog } from '@/features/galleries/components/GalleryEditedVersionDialog'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import { numerosDasFotosSelecionadas } from '@/features/galleries/lib/selection'

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
  const releaseRaw = useGalleryStore((state) => state.releaseRaw)
  const revokeRaw = useGalleryStore((state) => state.revokeRaw)
  const addToast = useToastStore((state) => state.addToast)
  const [editando, setEditando] = useState<MidiaGaleria | null>(null)
  const [baixandoSelecao, setBaixandoSelecao] = useState(false)

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
  const disponiveis = midias.filter((midia) => midia.processamentoStatus === 'disponivel')
  const podeEditarMidias = ['aguardando_upload', 'em_selecao'].includes(galeria.status)
  const podeEditarVersao = ['selecao_enviada', 'em_edicao', 'entregue'].includes(
    galeria.status,
  )
  const podeReabrirSelecao = !['entregue', 'cancelada'].includes(galeria.status)
  const selecionadas = new Set([
    ...(detalhe.selecao?.fotoIds ?? []),
    ...(detalhe.selecao?.videoIds ?? []),
  ])
  const fotosSelecionadas = fotos.filter((midia) => selecionadas.has(midia.id))
  const numerosSelecionados = numerosDasFotosSelecionadas(
    fotos,
    detalhe.selecao?.fotoIds ?? [],
  )
  const selecaoEnviada = detalhe.selecao?.status === 'enviada'
  const fotosEditadas = fotosSelecionadas.filter((midia) => midia.editadaDisponivel)
  const fotosSemEdicao = fotosSelecionadas.length - fotosEditadas.length
  const entregaBloqueada = !galeria.rawLiberado && fotosSemEdicao > 0
  const extrasPendentes = detalhe.extras?.status === 'pendente'
  const extrasQuitados =
    !detalhe.extras || ['pago', 'isento'].includes(detalhe.extras.status) || Boolean(detalhe.extras.liberacaoManual)

  const copiar = async (tipo: 'selecao' | 'entrega') => {
    const token = tipo === 'selecao' ? galeria.tokenSelecao : galeria.entrega?.token
    if (!token) return
    const path = tipo === 'selecao' ? `/selecao/${token}` : `/entrega/${token}`
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      addToast(`Link de ${tipo} copiado.`)
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
                {galeria.fotosInclusas ?? 0} fotos e {galeria.videosInclusos ?? 0}{' '}
                vídeos inclusos · extra{' '}
                {galeria.faixasFotoExtra && galeria.faixasFotoExtra.length > 0
                  ? `a partir de ${formatBRL(galeria.valorFotoExtra ?? 0)}`
                  : formatBRL(galeria.valorFotoExtra ?? 0)}
              </p>
            </div>
          </div>
          <GalleryStatusBadge status={galeria.status} />
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
                {fotos.length} fotos · {videos.length} vídeos · {disponiveis.length}{' '}
                disponíveis
                {fotosSelecionadas.length > 0
                  ? ` · ${fotosEditadas.length}/${fotosSelecionadas.length} selecionadas editadas`
                  : ''}
              </p>
            </div>
            {podeEditarMidias ? <GalleryMediaUploader galleryId={galeria.id} /> : null}
          </div>

          <div className="mt-4">
            <GalleryMediaGrid
              midias={midias}
              selectedIds={selecionadas}
              numerarFotos
              onRemove={podeEditarMidias ? (midia) => void remover(midia) : undefined}
              onEdit={podeEditarVersao ? (midia) => setEditando(midia) : undefined}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Link2 className="size-4 text-brand-600" />
              Seleção
            </h3>
            {galeria.tokenSelecao ? (
              <div className="mt-2 space-y-2 text-[11px] text-muted">
                <p>Disponível até {formatDateTime(galeria.prazoSelecaoEm)}.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void copiar('selecao')}>
                    <Copy className="size-3.5" />
                    Copiar link
                  </Button>
                  {podeReabrirSelecao ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void executar(() => reopenSelection(galeria.id), 'Seleção reaberta.')
                      }
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
            {detalhe.extras ? (
              <div className="mt-2 space-y-2 text-[11px] text-muted">
                <p>
                  {detalhe.extras.quantidadeFotos} foto(s) extra(s) ·{' '}
                  {formatBRL(detalhe.extras.valorTotal)} · status{' '}
                  <strong className="text-ink">{detalhe.extras.status}</strong>
                </p>
                {detalhe.extras.detalhamento &&
                detalhe.extras.detalhamento.length > 0 ? (
                  <p>
                    {detalhe.extras.detalhamento
                      .map(
                        (faixa) =>
                          `${faixa.quantidade} × ${formatBRL(faixa.valorUnitario)} = ${formatBRL(faixa.subtotal)}`,
                      )
                      .join(' · ')}
                  </p>
                ) : null}
                <p>
                  Pix dos extras:{' '}
                  {detalhe.extras.chavePix ? (
                    <strong className="text-ink">{detalhe.extras.chavePix}</strong>
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
                {extrasPendentes ? (
                  <>
                    {detalhe.extras.comprovanteEnviadoEm ? (
                      <div className="rounded-xl border border-line bg-canvas/60 p-2.5">
                        <p className="text-ink">
                          Comprovante: {detalhe.extras.comprovanteNome ?? 'arquivo'}
                        </p>
                        <p className="mt-0.5 text-[10px]">
                          Enviado em {formatDateTime(detalhe.extras.comprovanteEnviadoEm)}.
                        </p>
                        {detalhe.extras.comprovanteUrl ? (
                          <a
                            href={detalhe.extras.comprovanteUrl}
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
                        disabled={!detalhe.extras.comprovanteEnviadoEm}
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
                  </>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted">
                Nenhum extra cobrado nesta seleção.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {galeria.status === 'em_edicao' && extrasQuitados ? (
                <Button
                  size="sm"
                  onClick={() =>
                    void executar(
                      () => publishDelivery(galeria.id),
                      'Link de entrega publicado.',
                    )
                  }
                  disabled={entregaBloqueada}
                >
                  Publicar entrega
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Entrega</h3>
            {galeria.entrega?.token ? (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => void copiar('entrega')}>
                  <Copy className="size-3.5" />
                  Copiar link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void executar(() => revokeDelivery(galeria.id), 'Entrega revogada.')
                  }
                >
                  Revogar
                </Button>
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {galeria.entrega?.token
              ? `Disponível até ${formatDateTime(galeria.entrega.expiraEm)}.`
              : 'Ainda não publicada. Marque como pronta e publique após os extras.'}
          </p>
          {galeria.zipBaixadoEm || galeria.entrega?.token ? (
            <p className="mt-1 text-[11px] text-muted">
              {galeria.zipBaixadoEm
                ? `Cliente baixou o ZIP em ${formatDateTime(galeria.zipBaixadoEm)}.`
                : 'Cliente ainda não baixou o ZIP da entrega.'}
            </p>
          ) : null}

          {entregaBloqueada ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
              {fotosSemEdicao} foto(s) selecionada(s) sem versão editada. Envie as
              versões ou libere os RAW antes de publicar a entrega.
            </p>
          ) : null}

          <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-ink">
                  Arquivos originais (RAW)
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {galeria.rawLiberado
                    ? `Liberados por ${galeria.rawLiberadoPor ?? 'equipe'} em ${formatDateTime(galeria.rawLiberadoEm)}.`
                    : 'Não liberados. O cliente recebe apenas as versões editadas.'}
                </p>
              </div>
              {podeEditarVersao ? (
                galeria.rawLiberado ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void executar(() => revokeRaw(galeria.id), 'RAW revogado.')
                    }
                  >
                    Revogar RAW
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const por = window.prompt(
                        'Quem está liberando os RAW?',
                        'Equipe do estúdio',
                      )
                      if (por !== null) {
                        void executar(
                          () => releaseRaw(galeria.id, por),
                          'RAW liberado para download.',
                        )
                      }
                    }}
                  >
                    Liberar RAW
                  </Button>
                )
              ) : null}
            </div>
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
    </div>
  )
}
