import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Images,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useParams } from 'react-router-dom'

import type {
  FaseGaleriaPublica,
  MidiaGaleria,
  PedidoExtras,
  ResumoExtras,
} from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { mensagemDeErro } from '@/shared/api/errors'
import { ExtrasPaymentCard } from '@/features/galleries/components/public/ExtrasPaymentCard'
import { PublicConfirmDialog } from '@/features/galleries/components/public/PublicConfirmDialog'
import { PublicGalleryShell } from '@/features/galleries/components/public/PublicGalleryShell'
import { PublicMediaGrid } from '@/features/galleries/components/public/PublicMediaGrid'
import { PublicPhotoViewer } from '@/features/galleries/components/public/PublicPhotoViewer'
import { PublicSelectionBar } from '@/features/galleries/components/public/PublicSelectionBar'
import { calcularValorExtras } from '@/features/galleries/lib/selection'
import {
  baixarMidiaPublica,
  consultarGaleriaPublica,
  enviarSelecaoPublica,
  urlZipPublico,
  validarZipPublico,
} from '@/features/galleries/api/galeriasApi'

interface PublicData {
  galeria: Awaited<ReturnType<typeof consultarGaleriaPublica>>['galeria']
  midias: MidiaGaleria[]
  selecao?: Awaited<ReturnType<typeof consultarGaleriaPublica>>['selecao']
  extras?: PedidoExtras
  resumoExtras?: ResumoExtras
  midiasEntregues?: string[]
  estudioNome: string
  pacoteNome?: string
  token: string
  fase: FaseGaleriaPublica
  fotosSelecionadas: number
  fotosLiberadas: number
  videosSelecionados: number
  videosLiberados: number
}

type ViewerState = { tipo: 'foto' | 'video'; index: number }

function ordenarPorNumero(midias: MidiaGaleria[]): MidiaGaleria[] {
  return [...midias].sort((a, b) => a.numero - b.numero)
}

export function PublicSelectionPage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fotoIds, setFotoIds] = useState<Set<string>>(new Set())
  const [videoIds, setVideoIds] = useState<Set<string>>(new Set())
  const [atualizando, setAtualizando] = useState(false)
  const [baixandoZip, setBaixandoZip] = useState(false)
  const [confirmarOpen, setConfirmarOpen] = useState(false)
  const [viewer, setViewer] = useState<ViewerState | null>(null)

  useEffect(() => {
    let ativo = true
    consultarGaleriaPublica(token)
      .then((resultado) => {
        if (!ativo) return
        setData({ ...resultado, token })
        setFotoIds(new Set(resultado.selecao?.fotoIds ?? []))
        setVideoIds(new Set(resultado.selecao?.videoIds ?? []))
      })
      .catch((error) => {
        if (ativo) setErro(mensagemDeErro(error))
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [token])

  const fotos = useMemo(
    () =>
      ordenarPorNumero(
        (data?.midias ?? []).filter(
          (midia) =>
            midia.tipo === 'foto' && midia.processamentoStatus === 'disponivel',
        ),
      ),
    [data],
  )
  const videos = useMemo(
    () =>
      ordenarPorNumero(
        (data?.midias ?? []).filter(
          (midia) =>
            midia.tipo === 'video' && midia.processamentoStatus === 'disponivel',
        ),
      ),
    [data],
  )
  const fotosParaEdicao = fotos.filter((midia) => midia.finalidade !== 'pronta')
  const fotosProntas = fotos.filter((midia) => midia.finalidade === 'pronta')
  const entregues = useMemo(
    () => new Set(data?.midiasEntregues ?? []),
    [data?.midiasEntregues],
  )
  const fotosInclusas = data?.galeria.fotosInclusas ?? 0
  const videosInclusos = data?.galeria.videosInclusos ?? 0
  const extras = Math.max(0, fotoIds.size - fotosInclusas)
  const { valorTotal: valorExtras } = calcularValorExtras(
    data?.galeria.valorFotoExtra ?? 0,
    data?.galeria.faixasFotoExtra,
    extras,
  )
  const quantidadeCoberta = data?.resumoExtras?.quantidadeCoberta ?? 0
  const valorCoberto = data?.resumoExtras?.valorCoberto ?? 0
  const novosExtras = Math.max(0, extras - quantidadeCoberta)
  const novoValor = Math.max(
    0,
    Math.round((valorExtras - valorCoberto) * 100) / 100,
  )
  const extrasAbaixoDoCoberto = extras < quantidadeCoberta
  const podeEnviar =
    fotoIds.size >= fotosInclusas &&
    videoIds.size === videosInclusos &&
    !extrasAbaixoDoCoberto
  // Uma seleção reaberta continua disponível para edição; só bloqueia quando
  // o cliente já enviou a seleção atual.
  const selecaoEnviada = data?.selecao?.status === 'enviada'
  const podeSelecionar = data?.galeria.status === 'em_selecao' && !selecaoEnviada
  const viewerMidias = viewer?.tipo === 'video' ? videos : fotos

  const toggle = (set: Set<string>, id: string): Set<string> => {
    // Fotos e vídeos já entregues permanecem obrigatórios: o cliente só pode
    // acrescentar novas mídias, nunca trocar as que já baixou.
    if (entregues.has(id)) return set
    const proximo = new Set(set)
    if (proximo.has(id)) proximo.delete(id)
    else proximo.add(id)
    return proximo
  }

  const abrirMidia = (midia: MidiaGaleria) => {
    const lista = midia.tipo === 'video' ? videos : fotos
    const index = lista.findIndex((item) => item.id === midia.id)
    if (index >= 0) setViewer({ tipo: midia.tipo, index })
  }

  const validarSelecao = (): boolean => {
    setErro('')
    if (fotoIds.size < fotosInclusas) {
      setErro(`Selecione todas as ${fotosInclusas} fotos inclusas.`)
      return false
    }
    if (videoIds.size !== videosInclusos) {
      setErro(`Selecione exatamente ${videosInclusos} vídeo(s).`)
      return false
    }
    if (extrasAbaixoDoCoberto) {
      setErro(
        `Sua seleção tem ${extras} extra(s), abaixo dos ${quantidadeCoberta} já cobertos. ` +
          'Recoloque as fotos ou fale com o estúdio.',
      )
      return false
    }
    return true
  }

  const abrirConfirmacao = () => {
    if (validarSelecao()) setConfirmarOpen(true)
  }

  const enviar = async () => {
    setConfirmarOpen(false)
    setEnviando(true)
    try {
      const selecao = await enviarSelecaoPublica(token, [...fotoIds], [...videoIds])
      setData((atual) => (atual ? { ...atual, selecao } : atual))

      // A resposta da seleção não traz o pedido de extras. Recarrega a galeria
      // pública para exibir a chave Pix e o upload do comprovante na hora.
      try {
        const atualizado = await consultarGaleriaPublica(token)
        setData({ ...atualizado, token })
      } catch {
        // A seleção já foi enviada; a próxima visita recarrega os extras.
      }
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  const recarregar = async () => {
    setAtualizando(true)
    setErro('')
    try {
      const resultado = await consultarGaleriaPublica(token)
      setData({ ...resultado, token })
      setFotoIds(new Set(resultado.selecao?.fotoIds ?? []))
      setVideoIds(new Set(resultado.selecao?.videoIds ?? []))
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setAtualizando(false)
    }
  }

  const baixarMidia = async (midia: MidiaGaleria) => {
    setErro('')
    try {
      const { url } = await baixarMidiaPublica(token, midia.id)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = midia.nomeArquivo
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (error) {
      setErro(mensagemDeErro(error))
    }
  }

  const baixarZip = async () => {
    setErro('')
    setBaixandoZip(true)
    try {
      await validarZipPublico(token, 'auto')
      const anchor = document.createElement('a')
      anchor.href = urlZipPublico(token, 'auto')
      anchor.download = 'galeria-disponiveis.zip'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setBaixandoZip(false)
    }
  }

  if (loading) {
    return (
      <PublicGalleryShell>
        <div className="animate-pulse space-y-6 pt-4">
          <div className="h-3 w-32 rounded-full bg-[#E7DAC9]" />
          <div className="h-16 w-3/4 rounded-2xl bg-[#E7DAC9]" />
          <div className="h-4 w-1/2 rounded-full bg-[#E7DAC9]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] rounded-[1.15rem] bg-[#E7DAC9]"
              />
            ))}
          </div>
        </div>
        <span className="sr-only">Carregando seleção…</span>
      </PublicGalleryShell>
    )
  }

  if (!data) {
    return (
      <PublicGalleryShell>
        <StatusCard
          title="Não foi possível abrir a seleção"
          description={erro || 'Link inválido ou expirado.'}
        />
      </PublicGalleryShell>
    )
  }

  if (data.selecao && selecaoEnviada) {
    const disponiveis = ordenarPorNumero(
      data.midias.filter((midia) => midia.disponivelParaDownload),
    )
    const emLiberacao = ordenarPorNumero(
      data.midias.filter((midia) => !midia.disponivelParaDownload),
    )
    const total = data.fotosSelecionadas + data.videosSelecionados
    const liberadas = data.fotosLiberadas + data.videosLiberados
    const percentual = total > 0 ? Math.round((liberadas / total) * 100) : 0
    const aguardandoPagamento = data.fase === 'aguardando_pagamento'

    return (
      <PublicGalleryShell
        studioName={data.estudioNome}
        accent={data.galeria.pacoteCorHex}
      >
        <section className="pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#A08B72]">
                Sua galeria
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-[#2B241D] sm:text-6xl">
                {data.galeria.clienteNome ?? 'Sua galeria'}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#7A6A59]">
                {data.pacoteNome ?? 'Pacote'} · {liberadas} de {total} mídias
                liberadas · protocolo {data.selecao.protocolo}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void recarregar()}
              disabled={atualizando}
              className="border-[#E1D3C1] bg-white/70"
            >
              <RefreshCw
                className={`size-4 ${atualizando ? 'animate-spin' : ''}`}
              />
              {atualizando ? 'Atualizando…' : 'Atualizar'}
            </Button>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#E7DCCD] bg-white/70 p-5 shadow-[0_24px_60px_-40px_rgba(60,42,25,0.55)] backdrop-blur">
          <div className="flex items-center justify-between gap-2 text-xs">
            <h2 className="font-semibold text-[#2B241D]">
              Progresso da liberação
            </h2>
            <span className="text-[#7A6A59]">
              {liberadas}/{total}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EADCCB]">
            <div
              className="h-full rounded-full bg-[var(--gallery-accent)] transition-all duration-700"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#7A6A59]">
            {aguardandoPagamento
              ? 'As fotos já prontas serão liberadas assim que o pagamento dos extras for confirmado.'
              : emLiberacao.length > 0
                ? 'Você será avisado quando cada mídia ficar pronta. Não é necessário fazer nada.'
                : 'Tudo liberado. Bom proveito!'}
          </p>
        </section>

        {data.resumoExtras &&
        (data.resumoExtras.quantidadeTotal > 0 ||
          data.resumoExtras.quantidadePendente > 0) ? (
          <section className="mt-4 rounded-[1.5rem] border border-[#E7DCCD] bg-white/60 p-4 text-[11px] leading-relaxed text-[#7A6A59] backdrop-blur">
            <p>
              Total na seleção:{' '}
              <strong className="text-[#2B241D]">
                {data.resumoExtras.quantidadeTotal} extra(s) ·{' '}
                {formatBRL(data.resumoExtras.valorTotal)}
              </strong>
            </p>
            {data.resumoExtras.quantidadeCoberta > 0 ? (
              <p className="mt-0.5">
                Já coberto: {data.resumoExtras.quantidadeCoberta} extra(s) ·{' '}
                {formatBRL(data.resumoExtras.valorCoberto)}
              </p>
            ) : null}
            {data.resumoExtras.quantidadePendente > 0 ? (
              <p className="mt-0.5 font-semibold text-[#8A5A18]">
                A pagar agora: {data.resumoExtras.quantidadePendente} extra(s) ·{' '}
                {formatBRL(data.resumoExtras.valorPendente)}
              </p>
            ) : null}
          </section>
        ) : null}

        {data.extras && data.extras.status === 'pendente' ? (
          <div className="mt-4">
            <ExtrasPaymentCard
              token={data.token}
              extras={data.extras}
              titulo={
                data.resumoExtras && data.resumoExtras.quantidadeCoberta > 0
                  ? 'Extras adicionais'
                  : undefined
              }
              onChange={(extrasAtualizados) =>
                setData((atual) =>
                  atual ? { ...atual, extras: extrasAtualizados } : atual,
                )
              }
            />
          </div>
        ) : null}

        {disponiveis.length > 0 ? (
          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E7DCCD] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#A08B72]">
                  Prontas para você
                </p>
                <h2 className="mt-1 flex items-center gap-2 font-display text-2xl text-[#2B241D]">
                  <CheckCircle2 className="size-5 text-[#5F7A5B]" />
                  Disponíveis para baixar ({disponiveis.length})
                </h2>
                <p className="mt-1 text-xs text-[#7A6A59]">
                  Baixe individualmente ou tudo de uma vez em ZIP.
                </p>
              </div>
              <Button
                onClick={() => void baixarZip()}
                disabled={baixandoZip}
                className="bg-[#2B241D] hover:bg-[#40352B] active:bg-[#1F1914]"
              >
                <Download className="size-4" />
                {baixandoZip ? 'Preparando…' : 'Baixar todas (.zip)'}
              </Button>
            </div>
            <div className="mt-5">
              <PublicMediaGrid
                midias={disponiveis}
                onDownload={(midia) => void baixarMidia(midia)}
                onZoom={abrirMidia}
                watermark
                watermarkText={data.estudioNome}
                numerarFotos
              />
            </div>
          </section>
        ) : null}

        {emLiberacao.length > 0 ? (
          <section className="mt-10">
            <div className="border-b border-[#E7DCCD] pb-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#A08B72]">
                Quase lá
              </p>
              <h2 className="mt-1 flex items-center gap-2 font-display text-2xl text-[#2B241D]">
                <Clock className="size-5 text-[#B07A2A]" />
                Em liberação ({emLiberacao.length})
              </h2>
              <p className="mt-1 text-xs text-[#7A6A59]">
                Estas mídias ainda estão sendo preparadas. Avisaremos quando
                estiverem prontas.
              </p>
            </div>
            <div className="mt-5">
              <PublicMediaGrid
                midias={emLiberacao}
                onZoom={abrirMidia}
                watermark
                watermarkText={data.estudioNome}
                numerarFotos
              />
            </div>
          </section>
        ) : null}

        {erro ? <ErrorAlert mensagem={erro} /> : null}

        {viewer && viewerMidias[viewer.index] ? (
          <PublicPhotoViewer
            midias={viewerMidias}
            initialIndex={viewer.index}
            onClose={() => setViewer(null)}
            watermark
            watermarkText={data.estudioNome}
          />
        ) : null}
      </PublicGalleryShell>
    )
  }

  if (!podeSelecionar) {
    return (
      <PublicGalleryShell
        studioName={data.estudioNome}
        accent={data.galeria.pacoteCorHex}
      >
        <StatusCard
          title="Seleção indisponível"
          description="O estúdio ainda não liberou esta galeria para seleção."
        />
      </PublicGalleryShell>
    )
  }

  return (
    <PublicGalleryShell
      studioName={data.estudioNome}
      accent={data.galeria.pacoteCorHex}
    >
      <section className="pb-8 pt-2 sm:pb-12">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.26em] text-[#A08B72]">
          <span>Seleção de fotos</span>
          <span className="h-px w-8 bg-[#D9C8B4]" />
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3" />
            escolha com calma
          </span>
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.02] tracking-[-0.02em] text-[#2B241D] sm:text-6xl">
          {data.galeria.clienteNome ?? 'Sua galeria'}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#7A6A59] sm:text-base">
          Estas são as suas fotos. Toque para escolher, amplie para ver cada
          detalhe e envie a seleção quando estiver pronta.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#7A6A59]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E4D6C4] bg-white/60 px-3 py-1.5 backdrop-blur">
            <span className="size-2 rounded-full bg-[var(--gallery-accent)]" />
            {data.pacoteNome ?? 'Pacote'}
          </span>
          <span className="rounded-full border border-[#E4D6C4] bg-white/60 px-3 py-1.5 backdrop-blur">
            {fotosInclusas} {fotosInclusas === 1 ? 'foto' : 'fotos'} inclusas
          </span>
          <span className="rounded-full border border-[#E4D6C4] bg-white/60 px-3 py-1.5 backdrop-blur">
            {fotoIds.size} {fotoIds.size === 1 ? 'selecionada' : 'selecionadas'}
          </span>
        </div>
      </section>

      {data.resumoExtras && data.resumoExtras.quantidadeCoberta > 0 ? (
        <div className="mb-8 rounded-2xl border border-[#E8D2A8] bg-[#FFF7E8]/80 p-4 text-[11px] leading-relaxed text-[#8A5A18]">
          Você já comprou{' '}
          <strong>
            {data.resumoExtras.quantidadeCoberta} foto(s) extra(s)
          </strong>{' '}
          ({formatBRL(data.resumoExtras.valorCoberto)}). Ao adicionar mais, você
          paga apenas a diferença. As mídias já entregues estão bloqueadas e
          continuam selecionadas.
        </div>
      ) : null}

      <section className="space-y-10">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E7DCCD] pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#A08B72]">
                Sua seleção
              </p>
              <h2 className="mt-1 flex items-center gap-2 font-display text-2xl text-[#2B241D]">
                <Images className="size-5 text-[var(--gallery-accent)]" />
                Fotos ({fotoIds.size} selecionadas)
              </h2>
            </div>
            <p className="hidden text-[11px] text-[#8A7863] sm:block">
              As duas listas contam na mesma cota do pacote
            </p>
          </div>

          {fotosParaEdicao.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-[#2B241D]">
                Para edição ({fotosParaEdicao.length})
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#7A6A59]">
                Estas fotos ainda serão editadas pelo estúdio após o envio da
                seleção.
              </p>
              <div className="mt-4">
                <PublicMediaGrid
                  midias={fotosParaEdicao}
                  selectedIds={fotoIds}
                  lockedIds={entregues}
                  watermark
                  watermarkText={data.estudioNome}
                  numerarFotos
                  onToggle={(id) =>
                    setFotoIds((atual) => toggle(atual, id))
                  }
                  onZoom={abrirMidia}
                />
              </div>
            </div>
          ) : null}

          {fotosProntas.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-base font-semibold text-[#2B241D]">
                Prontas para baixar ({fotosProntas.length})
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#7A6A59]">
                Estas fotos já estão editadas e ficam disponíveis para download
                após o envio da seleção.
              </p>
              <div className="mt-4">
                <PublicMediaGrid
                  midias={fotosProntas}
                  selectedIds={fotoIds}
                  lockedIds={entregues}
                  watermark
                  watermarkText={data.estudioNome}
                  numerarFotos
                  onToggle={(id) =>
                    setFotoIds((atual) => toggle(atual, id))
                  }
                  onZoom={abrirMidia}
                />
              </div>
            </div>
          ) : null}
        </div>

        {videos.length > 0 ? (
          <div>
            <div className="border-b border-[#E7DCCD] pb-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#A08B72]">
                Movimento
              </p>
              <h2 className="mt-1 font-display text-2xl text-[#2B241D]">
                Vídeos ({videoIds.size} selecionados)
              </h2>
            </div>
            <div className="mt-5">
              <PublicMediaGrid
                midias={videos}
                selectedIds={videoIds}
                lockedIds={entregues}
                onToggle={(id) => setVideoIds((atual) => toggle(atual, id))}
                onZoom={abrirMidia}
              />
            </div>
          </div>
        ) : null}

        {erro ? <ErrorAlert mensagem={erro} /> : null}
      </section>

      <section className="mt-10 rounded-[1.5rem] border border-[#E7DCCD] bg-white/70 p-5 text-xs leading-relaxed text-[#7A6A59] shadow-[0_24px_60px_-45px_rgba(60,42,25,0.5)] backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#A08B72]">
          Resumo da seleção
        </p>
        <div className="mt-3 space-y-1">
          <p>
            Extras na seleção: <strong className="text-[#2B241D]">{extras}</strong>
            {extras > 0 ? ` · ${formatBRL(valorExtras)}` : ''}
          </p>
          {quantidadeCoberta > 0 ? (
            <>
              <p>
                Já cobertos: {quantidadeCoberta} · {formatBRL(valorCoberto)}
              </p>
              <p
                className={
                  novoValor > 0
                    ? 'font-semibold text-[#8A5A18]'
                    : 'text-[#4C7048]'
                }
              >
                {novoValor > 0
                  ? `Novas agora (a pagar): ${novosExtras} · ${formatBRL(novoValor)}`
                  : 'Nenhuma nova cobrança'}
              </p>
            </>
          ) : extras > 0 ? (
            <p className="font-semibold text-[#8A5A18]">
              A pagar agora: {extras} foto(s) extra(s) · {formatBRL(valorExtras)}
            </p>
          ) : (
            <p className="text-[#4C7048]">Nenhuma foto extra selecionada.</p>
          )}
          {extrasAbaixoDoCoberto ? (
            <p className="font-medium text-red-600">
              Seleção abaixo dos {quantidadeCoberta} extras já cobertos.
              Recoloque as fotos ou fale com o estúdio.
            </p>
          ) : null}
        </div>
      </section>

      <PublicSelectionBar
        fotosSelecionadas={fotoIds.size}
        fotosInclusas={fotosInclusas}
        videosSelecionados={videoIds.size}
        videosInclusos={videosInclusos}
        extras={extras}
        valorExtras={valorExtras}
        podeEnviar={podeEnviar}
        enviando={enviando}
        onEnviar={abrirConfirmacao}
      />

      <PublicConfirmDialog
        open={confirmarOpen}
        onClose={() => setConfirmarOpen(false)}
        onConfirm={() => void enviar()}
        enviando={enviando}
        fotos={fotoIds.size}
        videos={videoIds.size}
        fotosInclusas={fotosInclusas}
        videosInclusos={videosInclusos}
        extras={extras}
        valorExtras={valorExtras}
        quantidadeCoberta={quantidadeCoberta}
        valorCoberto={valorCoberto}
        novosExtras={novosExtras}
        novoValor={novoValor}
      />

      {viewer && viewerMidias[viewer.index] ? (
        <PublicPhotoViewer
          midias={viewerMidias}
          initialIndex={viewer.index}
          selectedIds={viewer.tipo === 'video' ? videoIds : fotoIds}
          lockedIds={entregues}
          onToggle={
            viewer.tipo === 'video'
              ? (id) => setVideoIds((atual) => toggle(atual, id))
              : (id) => setFotoIds((atual) => toggle(atual, id))
          }
          onClose={() => setViewer(null)}
          watermark
          watermarkText={data.estudioNome}
        />
      ) : null}
    </PublicGalleryShell>
  )
}

function ErrorAlert({ mensagem }: { mensagem: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-[11px] font-medium text-red-700"
    >
      {mensagem}
    </p>
  )
}

function StatusCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-lg rounded-[1.75rem] border border-[#E7DCCD] bg-white/80 p-8 text-center shadow-[0_28px_70px_-45px_rgba(60,42,25,0.55)] backdrop-blur">
      <AlertTriangle className="mx-auto size-8 text-[#B07A2A]" />
      <h1 className="mt-3 font-display text-2xl text-[#2B241D]">{title}</h1>
      <p className="mt-2 text-xs leading-relaxed text-[#7A6A59]">
        {description}
      </p>
    </div>
  )
}
