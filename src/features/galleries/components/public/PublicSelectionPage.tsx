import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Images,
  Loader2,
  RefreshCw,
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
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { ExtrasPaymentCard } from '@/features/galleries/components/public/ExtrasPaymentCard'
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
  token: string
  fase: FaseGaleriaPublica
  fotosSelecionadas: number
  fotosLiberadas: number
  videosSelecionados: number
  videosLiberados: number
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
      (data?.midias ?? []).filter(
        (midia) => midia.tipo === 'foto' && midia.processamentoStatus === 'disponivel',
      ),
    [data],
  )
  const videos = useMemo(
    () =>
      (data?.midias ?? []).filter(
        (midia) => midia.tipo === 'video' && midia.processamentoStatus === 'disponivel',
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

  const toggle = (set: Set<string>, id: string): Set<string> => {
    // Fotos e vídeos já entregues permanecem obrigatórios: o cliente só pode
    // acrescentar novas mídias, nunca trocar as que já baixou.
    if (entregues.has(id)) return set
    const proximo = new Set(set)
    if (proximo.has(id)) proximo.delete(id)
    else proximo.add(id)
    return proximo
  }

  const enviar = async () => {
    setErro('')
    if (fotoIds.size < fotosInclusas) {
      setErro(`Selecione todas as ${fotosInclusas} fotos inclusas.`)
      return
    }
    if (videoIds.size !== videosInclusos) {
      setErro(`Selecione exatamente ${videosInclusos} vídeo(s).`)
      return
    }
    if (extrasAbaixoDoCoberto) {
      setErro(
        `Sua seleção tem ${extras} extra(s), abaixo dos ${quantidadeCoberta} já cobertos. ` +
          'Recoloque as fotos ou fale com o estúdio.',
      )
      return
    }

    const confirmado = window.confirm(
      extras > 0
        ? quantidadeCoberta > 0
          ? `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos?\n\n` +
            `Já cobertos: ${quantidadeCoberta} extra(s) · ${formatBRL(valorCoberto)}.\n` +
            (novosExtras > 0
              ? `Novas agora: ${novosExtras} extra(s) · ${formatBRL(novoValor)}.\n`
              : 'Nenhuma nova cobrança.\n') +
            `Total da seleção: ${extras} extra(s) · ${formatBRL(valorExtras)}.`
          : `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos? Serão cobradas ${extras} foto(s) extra(s), total de ${formatBRL(valorExtras)}.`
        : `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos?`,
    )
    if (!confirmado) return

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
      <PublicShell studioName={data?.estudioNome}>
        <div className="grid min-h-[50dvh] place-items-center">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Carregando seleção…
          </span>
        </div>
      </PublicShell>
    )
  }

  if (!data) {
    return (
      <PublicShell>
        <StatusCard
          title="Não foi possível abrir a seleção"
          description={erro || 'Link inválido ou expirado.'}
        />
      </PublicShell>
    )
  }

  if (data.selecao && selecaoEnviada) {
    const disponiveis = data.midias.filter((midia) => midia.disponivelParaDownload)
    const emLiberacao = data.midias.filter((midia) => !midia.disponivelParaDownload)
    const total = data.fotosSelecionadas + data.videosSelecionados
    const liberadas = data.fotosLiberadas + data.videosLiberados
    const percentual = total > 0 ? Math.round((liberadas / total) * 100) : 0
    const aguardandoPagamento = data.fase === 'aguardando_pagamento'

    return (
      <PublicShell studioName={data?.estudioNome}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sua galeria
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {data.galeria.clienteNome ?? 'Sua galeria'}
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              {liberadas} de {total} mídias liberadas · protocolo{' '}
              {data.selecao.protocolo}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void recarregar()}
            disabled={atualizando}
          >
            <RefreshCw className={`size-4 ${atualizando ? 'animate-spin' : ''}`} />
            {atualizando ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <div className="mb-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-ink">Progresso da liberação</span>
            <span className="text-muted">
              {liberadas}/{total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {aguardandoPagamento
              ? 'As fotos já prontas serão liberadas assim que o pagamento dos extras for confirmado.'
              : emLiberacao.length > 0
                ? 'Você será avisado quando cada mídia ficar pronta. Não é necessário fazer nada.'
                : 'Tudo liberado. Bom proveito!'}
          </p>
        </div>

        {data.resumoExtras &&
        (data.resumoExtras.quantidadeTotal > 0 ||
          data.resumoExtras.quantidadePendente > 0) ? (
          <div className="mb-4 rounded-2xl border border-line bg-surface p-4 text-[11px] text-muted shadow-card">
            <p>
              Total na seleção:{' '}
              <strong className="text-ink">
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
              <p className="mt-0.5 font-semibold text-ink">
                A pagar agora: {data.resumoExtras.quantidadePendente} extra(s) ·{' '}
                {formatBRL(data.resumoExtras.valorPendente)}
              </p>
            ) : null}
          </div>
        ) : null}

        {data.extras && data.extras.status === 'pendente' ? (
          <div className="mb-4">
            <ExtrasPaymentCard
              token={data.token}
              extras={data.extras}
              titulo={
                data.resumoExtras && data.resumoExtras.quantidadeCoberta > 0
                  ? 'Extras adicionais'
                  : undefined
              }
              onChange={(extras) =>
                setData((atual) => (atual ? { ...atual, extras } : atual))
              }
            />
          </div>
        ) : null}

        {disponiveis.length > 0 ? (
          <section className="mb-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Disponíveis para baixar ({disponiveis.length})
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Baixe individualmente ou tudo de uma vez em ZIP.
                </p>
              </div>
              <Button onClick={() => void baixarZip()} disabled={baixandoZip}>
                <Download className="size-4" />
                {baixandoZip ? 'Preparando…' : 'Baixar todas (.zip)'}
              </Button>
            </div>
            <div className="mt-3">
              <GalleryMediaGrid
                midias={disponiveis}
                onDownload={(midia) => void baixarMidia(midia)}
                watermark
                watermarkText={data.estudioNome}
                hideEditBadge
              />
            </div>
          </section>
        ) : null}

        {emLiberacao.length > 0 ? (
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="size-4 text-amber-600" />
              Em liberação ({emLiberacao.length})
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Estas mídias ainda estão sendo preparadas. Avisaremos quando
              estiverem prontas.
            </p>
            <div className="mt-3">
              <GalleryMediaGrid
                midias={emLiberacao}
                watermark
                watermarkText={data.estudioNome}
                hideEditBadge
              />
            </div>
          </section>
        ) : null}

        {erro ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700 ring-1 ring-red-200"
          >
            {erro}
          </p>
        ) : null}
      </PublicShell>
    )
  }

  if (!podeSelecionar) {
    return (
      <PublicShell studioName={data?.estudioNome}>
        <StatusCard
          title="Seleção indisponível"
          description="O estúdio ainda não liberou esta galeria para seleção."
        />
      </PublicShell>
    )
  }

  return (
    <PublicShell studioName={data.estudioNome}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Seleção de fotos e vídeos
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
          {data.galeria.clienteNome ?? 'Sua galeria'}
        </h1>
        <p className="mt-0.5 text-xs text-muted">
          {fotosInclusas} {fotosInclusas === 1 ? 'foto' : 'fotos'} e{' '}
          {videosInclusos} {videosInclusos === 1 ? 'vídeo' : 'vídeos'} inclusos.
          As fotos estão numeradas; use o número para se referir a cada uma.
        </p>
      </div>

      {data.resumoExtras && data.resumoExtras.quantidadeCoberta > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-800">
          Você já comprou{' '}
          <strong>{data.resumoExtras.quantidadeCoberta} foto(s) extra(s)</strong> (
          {formatBRL(data.resumoExtras.valorCoberto)}). Ao adicionar mais, você paga
          apenas a diferença. As mídias já entregues estão bloqueadas e continuam
          selecionadas.
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Images className="size-4 text-brand-600" />
            Fotos ({fotoIds.size} selecionadas)
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            As duas listas contam na mesma cota do pacote.
          </p>
        </div>

        {fotosParaEdicao.length > 0 ? (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-ink">
              Para edição ({fotosParaEdicao.length})
            </h3>
            <p className="mb-2 text-[11px] text-muted">
              Estas fotos ainda serão editadas pelo estúdio após o envio da seleção.
            </p>
            <GalleryMediaGrid
              midias={fotosParaEdicao}
              selectedIds={fotoIds}
              lockedIds={entregues}
              watermark
              watermarkText={data.estudioNome}
              numerarFotos
              hideEditBadge
              onToggle={(id) => setFotoIds((atual) => toggle(atual, id))}
            />
          </div>
        ) : null}

        {fotosProntas.length > 0 ? (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-ink">
              Prontas para baixar ({fotosProntas.length})
            </h3>
            <p className="mb-2 text-[11px] text-muted">
              Estas fotos já estão editadas e ficam disponíveis para download
              após o envio da seleção.
            </p>
            <GalleryMediaGrid
              midias={fotosProntas}
              selectedIds={fotoIds}
              lockedIds={entregues}
              watermark
              watermarkText={data.estudioNome}
              numerarFotos
              hideEditBadge
              onToggle={(id) => setFotoIds((atual) => toggle(atual, id))}
            />
          </div>
        ) : null}

        {videos.length > 0 ? (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">
              Vídeos ({videoIds.size} selecionados)
            </h2>
            <GalleryMediaGrid
              midias={videos}
              selectedIds={videoIds}
              lockedIds={entregues}
              hideEditBadge
              onToggle={(id) => setVideoIds((atual) => toggle(atual, id))}
            />
          </div>
        ) : null}

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="space-y-1 text-xs text-muted">
            <p>
              Extras na seleção: <strong className="text-ink">{extras}</strong>
              {extras > 0 ? ` · ${formatBRL(valorExtras)}` : ''}
            </p>
            {quantidadeCoberta > 0 ? (
              <>
                <p>
                  Já cobertos: {quantidadeCoberta} · {formatBRL(valorCoberto)}
                </p>
                <p
                  className={
                    novosExtras > 0
                      ? 'font-semibold text-amber-700'
                      : 'text-emerald-700'
                  }
                >
                  {novosExtras > 0
                    ? `Novas agora (a pagar): ${novosExtras} · ${formatBRL(novoValor)}`
                    : 'Nenhuma nova cobrança'}
                </p>
              </>
            ) : extras > 0 ? (
              <p className="font-semibold text-amber-700">
                A pagar agora: {extras} foto(s) extra(s) · {formatBRL(valorExtras)}
              </p>
            ) : (
              <p className="text-emerald-700">Nenhuma foto extra selecionada.</p>
            )}
            {extrasAbaixoDoCoberto ? (
              <p className="font-medium text-red-600">
                Seleção abaixo dos {quantidadeCoberta} extras já cobertos.
                Recoloque as fotos ou fale com o estúdio.
              </p>
            ) : null}
          </div>
          {erro ? (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {erro}
            </p>
          ) : null}
          <Button
            className="mt-3"
            fullWidth
            disabled={enviando || !podeEnviar}
            onClick={() => void enviar()}
          >
            <CheckCircle2 className="size-4" />
            {enviando ? 'Enviando seleção…' : 'Enviar seleção'}
          </Button>
          {!podeEnviar && !extrasAbaixoDoCoberto ? (
            <p className="mt-2 text-[11px] text-muted">
              Selecione pelo menos {fotosInclusas}{' '}
              {fotosInclusas === 1 ? 'foto' : 'fotos'} e {videosInclusos}{' '}
              {videosInclusos === 1 ? 'vídeo' : 'vídeos'} para enviar.
            </p>
          ) : null}
        </div>
      </section>
    </PublicShell>
  )
}

function PublicShell({
  children,
  studioName,
}: {
  children: ReactNode
  studioName?: string
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-ink">
          {studioName ?? 'Photoizer CRM'}
        </p>
        <p className="text-[11px] text-muted">Sua galeria</p>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

function StatusCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      <AlertTriangle className="mx-auto size-7 text-amber-600" />
      <h1 className="mt-2 text-base font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  )
}
