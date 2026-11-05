import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Film,
  Images,
  Loader2,
  Lock,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useParams } from 'react-router-dom'

import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { useGalleryCrossTabSync } from '@/features/galleries/hooks/useGalleryCrossTabSync'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import {
  calcularResultadoSelecao,
  getCondicoesGaleria,
  selecaoExpirada,
  validarSelecao,
} from '@/features/galleries/lib/selection'

export function PublicSelectionPage() {
  const { token = '' } = useParams()
  useGalleryCrossTabSync()
  const galerias = useGalleryStore((state) => state.galerias)
  const submitSelection = useGalleryStore((state) => state.submitSelection)
  const appointments = useAppointmentStore((state) => state.appointments)
  const pacotes = usePackageStore((state) => state.pacotes)
  const clientes = useClientStore((state) => state.clientes)
  const estudio = useStudioStore((state) => state.estudio)

  const galeria = galerias.find((item) => item.tokenSelecao === token)
  const appointment = galeria
    ? appointments.find((item) => item.id === galeria.agendamentoId)
    : undefined
  const pacote = appointment
    ? pacotes.find((item) => item.id === appointment.pacoteId)
    : undefined
  const cliente = appointment?.clienteId
    ? clientes.find((item) => item.id === appointment.clienteId)
    : undefined
  const nome =
    cliente?.nome ?? appointment?.contato?.nome ?? 'Cliente'

  const condicoes = useMemo(
    () => getCondicoesGaleria(appointment, pacote),
    [appointment, pacote],
  )

  const [fotoIds, setFotoIds] = useState<Set<string>>(new Set())
  const [videoIds, setVideoIds] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!galeria?.selecao) return
    // oxlint-disable-next-line react/set-state-in-effect
    setFotoIds(new Set(galeria.selecao.fotoIds))
    // oxlint-disable-next-line react/set-state-in-effect
    setVideoIds(new Set(galeria.selecao.videoIds))
  }, [galeria?.id, galeria?.selecao])

  if (!galeria) {
    return (
      <PublicShell studioName={estudio.nome}>
        <StatusCard
          tone="amber"
          title="Link inválido"
          description="Esta seleção não foi encontrada. Solicite um novo link ao estúdio."
        />
      </PublicShell>
    )
  }

  const fotos = galeria.midias.filter(
    (midia) => midia.tipo === 'foto' && midia.status === 'original',
  )
  const videos = galeria.midias.filter(
    (midia) => midia.tipo === 'video' && midia.status === 'original',
  )
  const resultado = calcularResultadoSelecao(
    fotoIds.size,
    videoIds.size,
    condicoes,
  )
  const validacao = validarSelecao(
    [...fotoIds],
    [...videoIds],
    condicoes,
  )
  const expirada = selecaoExpirada(galeria)
  const podeSelecionar = galeria.status === 'em_selecao' && !expirada
  const jaEnviada = Boolean(galeria.selecao) && galeria.status !== 'em_selecao'

  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const handleToggleFoto = (id: string) => {
    setErro('')
    setFotoIds((current) => toggle(current, id))
  }

  const handleToggleVideo = (id: string) => {
    setErro('')
    setVideoIds((current) => toggle(current, id))
  }

  const handleSubmit = () => {
    setErro('')

    if (!validacao.ok) {
      setErro(validacao.erros[0] ?? 'Revise a seleção antes de enviar.')
      return
    }

    const confirmado = window.confirm(
      resultado.fotosExtras > 0
        ? `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos? Serão cobradas ${resultado.fotosExtras} foto(s) extra(s), total de ${formatBRL(
            resultado.valorExtras,
          )}.`
        : `Enviar ${fotoIds.size} fotos e ${videoIds.size} vídeos?`,
    )
    if (!confirmado) return

    setEnviando(true)
    const selecao = submitSelection(token, [...fotoIds], [...videoIds])
    setEnviando(false)

    if (!selecao) {
      setErro('Não foi possível enviar a seleção. Verifique se o link ainda está aberto.')
      return
    }
  }

  return (
    <PublicShell studioName={estudio.nome}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Seleção de fotos e vídeos
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{nome}</h1>
        <p className="mt-0.5 text-xs text-muted">
          {pacote?.nome ?? 'Pacote'} · {condicoes.fotosInclusas} fotos e{' '}
          {condicoes.videosInclusos} vídeos inclusos
        </p>
      </div>

      {expirada && !jaEnviada ? (
        <StatusCard
          tone="amber"
          title="Prazo de seleção encerrado"
          description="O prazo de 30 dias terminou. Fale com o estúdio para reabrir o mesmo link."
        />
      ) : null}

      {galeria.status === 'aguardando_upload' ? (
        <StatusCard
          tone="amber"
          title="Galeria ainda não liberada"
          description="O estúdio está preparando as mídias. Você receberá o link quando a seleção estiver disponível."
        />
      ) : null}

      {jaEnviada ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="size-4" />
              Seleção enviada com sucesso
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
              {galeria.selecao?.fotoIds.length} fotos e{' '}
              {galeria.selecao?.videoIds.length} vídeos selecionados.
            </p>
          </section>

          {galeria.pedidoExtras ? (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles className="size-4 text-amber-600" />
                    Fotos extras
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    {galeria.pedidoExtras.quantidadeFotos} foto(s) ×{' '}
                    {formatBRL(galeria.pedidoExtras.valorUnitario)} ={' '}
                    <span className="font-semibold text-ink">
                      {formatBRL(galeria.pedidoExtras.valorTotal)}
                    </span>
                  </p>
                </div>
                <span
                  className={
                    galeria.pedidoExtras.status === 'pago'
                      ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200'
                      : galeria.pedidoExtras.status === 'isento'
                        ? 'rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200'
                        : 'rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200'
                  }
                >
                  {galeria.pedidoExtras.status === 'pago'
                    ? 'Pago'
                    : galeria.pedidoExtras.status === 'isento'
                      ? 'Isento'
                      : 'Aguardando confirmação'}
                </span>
              </div>

              {galeria.pedidoExtras.status === 'pendente' ? (
                <div className="mt-3 rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted ring-1 ring-line">
                  <p className="flex items-center gap-1.5 font-medium text-ink">
                    <Wallet className="size-3.5" />
                    Pagamento via Pix
                  </p>
                  {estudio.chavePix ? (
                    <p className="mt-1">
                      Chave Pix:{' '}
                      <span className="font-semibold text-ink">{estudio.chavePix}</span>
                    </p>
                  ) : null}
                  <p className="mt-1">
                    Envie o comprovante ao estúdio. A edição começa após a confirmação.
                  </p>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Nenhuma foto extra
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Sua seleção está dentro do pacote. O estúdio iniciará a edição.
              </p>
            </section>
          )}

          {galeria.status === 'entregue' ? (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-sm font-semibold text-ink">Entrega disponível</p>
              <p className="mt-1 text-[11px] text-muted">
                O estúdio publicou o link de download. Verifique a mensagem recebida.
              </p>
            </section>
          ) : null}
        </div>
      ) : null}

      {podeSelecionar ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Images className="size-4 text-brand-600" />
                Fotos
              </h2>
              <p className="text-[11px] text-muted">
                {fotoIds.size} selecionadas · mínimo {condicoes.fotosInclusas}
              </p>
            </div>
            <div className="mt-3">
              <GalleryMediaGrid
                midias={fotos}
                selectedIds={fotoIds}
                onToggle={handleToggleFoto}
                emptyLabel="Nenhuma foto disponível."
                watermark
              />
            </div>
          </section>

          {condicoes.videosInclusos > 0 ? (
            <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Film className="size-4 text-purple-600" />
                  Vídeos
                </h2>
                <p className="text-[11px] text-muted">
                  {videoIds.size} selecionados · exatamente {condicoes.videosInclusos}
                </p>
              </div>
              <div className="mt-3">
                <GalleryMediaGrid
                  midias={videos}
                  selectedIds={videoIds}
                  onToggle={handleToggleVideo}
                  emptyLabel="Nenhum vídeo disponível."
                />
              </div>
            </section>
          ) : null}

          <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="mx-auto max-w-4xl space-y-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                <span>
                  Fotos: <strong className="text-ink">{fotoIds.size}</strong> /{' '}
                  {condicoes.fotosInclusas} inclusas
                </span>
                {resultado.fotosExtras > 0 ? (
                  <span className="font-medium text-amber-700">
                    {resultado.fotosExtras} extra(s) ·{' '}
                    {formatBRL(resultado.valorExtras)}
                  </span>
                ) : (
                  <span className="text-emerald-700">Sem extras</span>
                )}
              </div>

              {erro ? (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {erro}
                </p>
              ) : !validacao.ok ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Lock className="size-3" />
                  {validacao.erros[0]}
                </p>
              ) : null}

              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!validacao.ok || enviando}
              >
                {enviando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {enviando ? 'Enviando…' : 'Enviar seleção para edição'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!podeSelecionar && !jaEnviada && !expirada && galeria.status !== 'aguardando_upload' ? (
        <StatusCard
          tone="amber"
          title="Seleção indisponível"
          description="Este link não está aceitando novos envios. Fale com o estúdio."
        />
      ) : null}

      <footer className="mt-8 pb-6 text-center text-[10px] text-muted">
        {estudio.nome} · Prazo de seleção de 30 dias · Fotos extras são cobradas por
        unidade.
      </footer>
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
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Images className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {studioName ?? 'Photoizer Estúdio'}
            </p>
            <p className="text-[11px] text-muted">Seleção de fotos e vídeos</p>
          </div>
          <span className="ml-auto hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
            <Lock className="size-3" />
            Link privado
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

function StatusCard({
  tone,
  title,
  description,
}: {
  tone: 'amber' | 'red'
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      <span
        className={
          tone === 'amber'
            ? 'mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700'
            : 'mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700'
        }
      >
        {tone === 'amber' ? (
          <Clock3 className="size-6" />
        ) : (
          <AlertTriangle className="size-6" />
        )}
      </span>
      <h1 className="mt-3 text-base font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  )
}
