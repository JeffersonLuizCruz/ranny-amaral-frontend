import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { copiarTexto } from '@/shared/lib/clipboard'
import { compartilharLink } from '@/shared/lib/share'
import { useToastStore } from '@/shared/store/toastStore'

interface GalleryDeliveryDialogProps {
  open: boolean
  onClose: () => void
  galeriaId: string
  totalSelecionado: number
  totalPronto: number
  totalLiberado: number
  bloqueioExtras: boolean
  prontas: MidiaGaleria[]
}

export function GalleryDeliveryDialog({
  open,
  onClose,
  galeriaId,
  totalSelecionado,
  totalPronto,
  totalLiberado,
  bloqueioExtras,
  prontas,
}: GalleryDeliveryDialogProps) {
  const entregarAoCliente = useGalleryStore((state) => state.entregarAoCliente)
  const addToast = useToastStore((state) => state.addToast)
  const [entregando, setEntregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ token: string } | null>(null)

  const faltamProntas = Math.max(0, totalSelecionado - totalPronto)
  const faltamLiberar = Math.max(0, totalSelecionado - totalLiberado)
  const pronto = faltamProntas === 0 && !bloqueioExtras
  const url = resultado ? `${window.location.origin}/galeria/${resultado.token}` : ''

  const confirmar = async () => {
    if (!pronto) return
    setEntregando(true)
    setErro(null)
    try {
      const entrega = await entregarAoCliente(galeriaId)
      setResultado({ token: entrega.token })
      addToast('Entrega publicada.')
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEntregando(false)
    }
  }

  const copiar = async () => {
    if (!url) return
    if (await copiarTexto(url)) {
      addToast('Link da entrega copiado.')
    } else {
      addToast('Não foi possível copiar o link.')
    }
  }

  const compartilhar = async () => {
    if (!url) return
    const status = await compartilharLink('Sua galeria está pronta', url)
    if (status === 'copiado') addToast('Link copiado para compartilhar.')
    if (status === 'falhou') addToast('Não foi possível compartilhar o link.')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resultado ? 'Entrega publicada' : 'Entregar ao cliente'}
      description={
        resultado
          ? 'O link já está disponível para copiar ou compartilhar.'
          : 'Revise o resumo antes de liberar as fotos para o cliente.'
      }
    >
      {resultado ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 className="size-10 text-emerald-600" />
            <p className="text-sm font-semibold text-ink">
              {totalSelecionado} mídia(s) entregues
            </p>
            <p className="text-[11px] text-muted">
              A seleção foi travada. As mídias entregues não podem mais ser removidas.
            </p>
          </div>

          <div className="rounded-xl bg-canvas/70 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Link do cliente
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-ink">{url}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" className="w-full" onClick={() => void copiar()}>
              <Copy className="size-4" />
              Copiar link
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={() => void compartilhar()}
            >
              <Share2 className="size-4" />
              Compartilhar
            </Button>
          </div>

          <Button size="lg" variant="ghost" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {prontas.length > 0 ? (
            <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1">
              {prontas.slice(0, 12).map((midia) => {
                const urlMidia =
                  midia.thumbUrl ?? midia.webUrl ?? midia.editadaUrl ?? midia.originalUrl
                return urlMidia ? (
                  <img
                    key={midia.id}
                    src={urlMidia}
                    alt={midia.nomeArquivo}
                    loading="lazy"
                    className="size-14 shrink-0 snap-start rounded-lg object-cover ring-1 ring-line"
                  />
                ) : null
              })}
            </div>
          ) : null}

          <div className="space-y-2">
            <ItemChecklist
              ok
              titulo="Seleção enviada"
              detalhe={`${totalSelecionado} mídia(s) selecionada(s)`}
            />
            <ItemChecklist
              ok={!bloqueioExtras}
              titulo="Extras"
              detalhe={
                bloqueioExtras
                  ? 'Há pedido de extras pendente'
                  : 'Sem pendências'
              }
            />
            <ItemChecklist
              ok={faltamProntas === 0}
              titulo="Versão final"
              detalhe={`${totalPronto}/${totalSelecionado} com versão final`}
            />
            <ItemChecklist
              ok
              titulo="Disponibilização"
              detalhe={
                faltamLiberar === 0
                  ? 'Todas já estão disponíveis'
                  : `${faltamLiberar} serão disponibilizadas agora`
              }
            />
          </div>

          <div className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
            As fotos ficarão disponíveis no link único. A seleção será travada e as
            mídias entregues não poderão ser removidas. O link vale 90 dias.
          </div>

          {faltamProntas > 0 ? (
            <p className="text-[11px] text-muted">
              Envie as versões editadas de todas as fotos selecionadas antes de
              entregar. Faltam {faltamProntas}.
            </p>
          ) : null}

          {erro ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700 ring-1 ring-red-200">
              {erro}
            </p>
          ) : null}

          <div className="sticky bottom-0 -mx-5 -mb-4 mt-2 border-t border-line bg-surface px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              className="w-full"
              onClick={() => void confirmar()}
              disabled={!pronto || entregando}
            >
              {entregando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {entregando ? 'Entregando…' : 'Entregar ao cliente'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ItemChecklist({
  ok,
  titulo,
  detalhe,
}: {
  ok: boolean
  titulo: string
  detalhe: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-canvas/70 px-3 py-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink">{titulo}</p>
        <p className="text-[10px] text-muted">{detalhe}</p>
      </div>
    </div>
  )
}
