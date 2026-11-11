import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Images, Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type { MidiaGaleria, PedidoExtras, ResumoExtras } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { mensagemDeErro } from '@/shared/api/errors'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { ExtrasPaymentCard } from '@/features/galleries/components/public/ExtrasPaymentCard'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import { calcularValorExtras, numerosDasFotosSelecionadas } from '@/features/galleries/lib/selection'
import {
  consultarGaleriaPublica,
  enviarSelecaoPublica,
} from '@/features/galleries/api/galeriasApi'

interface PublicData {
  galeria: Awaited<ReturnType<typeof consultarGaleriaPublica>>['galeria']
  midias: MidiaGaleria[]
  selecao?: Awaited<ReturnType<typeof consultarGaleriaPublica>>['selecao']
  extras?: PedidoExtras
  resumoExtras?: ResumoExtras
  midiasEntregues: string[]
  token: string
}

export function PublicSelectionPage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fotoIds, setFotoIds] = useState<Set<string>>(new Set())
  const [videoIds, setVideoIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let ativo = true
    consultarGaleriaPublica(token)
      .then((resultado) => {
        if (!ativo) return
        setData({
          galeria: resultado.galeria,
          midias: resultado.midias,
          selecao: resultado.selecao,
          extras: resultado.extras,
          resumoExtras: resultado.resumoExtras,
          midiasEntregues: resultado.midiasEntregues ?? [],
          token,
        })
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
  const numerosSelecionados = useMemo(
    () => numerosDasFotosSelecionadas(fotos, data?.selecao?.fotoIds ?? []),
    [fotos, data?.selecao],
  )
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
    const confirmado = window.confirm(
      extras > 0
        ? `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos? Serão cobradas ${extras} foto(s) extra(s), total de ${formatBRL(valorExtras)}.`
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
        setData({
          galeria: atualizado.galeria,
          midias: atualizado.midias,
          selecao: atualizado.selecao,
          extras: atualizado.extras,
          resumoExtras: atualizado.resumoExtras,
          midiasEntregues: atualizado.midiasEntregues ?? [],
          token,
        })
      } catch {
        // A seleção já foi enviada; a próxima visita recarrega os extras.
      }
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <PublicShell>
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
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-card">
          <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
          <h1 className="mt-2 text-lg font-semibold text-ink">Seleção enviada</h1>
          <p className="mt-1 text-sm text-muted">
            Protocolo <strong className="text-ink">{data.selecao.protocolo}</strong>
          </p>
          <p className="mt-2 text-xs text-muted">
            {data.selecao.fotoIds.length} fotos e {data.selecao.videoIds.length} vídeos
            selecionados.
          </p>
          {numerosSelecionados.length > 0 ? (
            <p className="mt-1 text-xs text-muted">
              Fotos:{' '}
              <strong className="text-ink">
                {numerosSelecionados.map(formatarNumeroFoto).join(', ')}
              </strong>
            </p>
          ) : null}
          {data.selecao.fotosExtras > 0 ? (
            <p className="mt-2 text-xs text-ink">
              {data.selecao.fotosExtras} foto(s) extra(s) ·{' '}
              {formatBRL(data.selecao.valorExtras)}
            </p>
          ) : null}
        </div>

        {data.extras ? (
          <div className="mx-auto max-w-lg">
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
      </PublicShell>
    )
  }

  if (!podeSelecionar) {
    return (
      <PublicShell>
        <StatusCard
          title="Seleção indisponível"
          description="O estúdio ainda não liberou esta galeria para seleção."
        />
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Seleção de fotos e vídeos
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
          {data.galeria.clienteNome ?? 'Sua galeria'}
        </h1>
        <p className="mt-0.5 text-xs text-muted">
          {fotosInclusas} fotos e {videosInclusos} vídeos inclusos. As fotos estão
          numeradas; use o número para se referir a cada uma.
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
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Images className="size-4 text-brand-600" />
            Fotos ({fotoIds.size} selecionadas)
          </h2>
          <GalleryMediaGrid
            midias={fotos}
            selectedIds={fotoIds}
            lockedIds={entregues}
            watermark
            numerarFotos
            onToggle={(id) => setFotoIds((atual) => toggle(atual, id))}
          />
        </div>

        {videos.length > 0 ? (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">
              Vídeos ({videoIds.size} selecionados)
            </h2>
            <GalleryMediaGrid
              midias={videos}
              selectedIds={videoIds}
              lockedIds={entregues}
              onToggle={(id) => setVideoIds((atual) => toggle(atual, id))}
            />
          </div>
        ) : null}

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <p className="text-xs text-muted">
            {extras > 0
              ? `${extras} foto(s) extra(s) · ${formatBRL(valorExtras)}`
              : 'Nenhuma foto extra selecionada.'}
          </p>
          {erro ? (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {erro}
            </p>
          ) : null}
          <Button className="mt-3" fullWidth disabled={enviando} onClick={() => void enviar()}>
            <CheckCircle2 className="size-4" />
            {enviando ? 'Enviando seleção…' : 'Enviar seleção'}
          </Button>
        </div>
      </section>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-ink">Photoizer CRM</p>
        <p className="text-[11px] text-muted">Seleção de fotos e vídeos</p>
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
