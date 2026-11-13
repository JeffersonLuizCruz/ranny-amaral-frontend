import { CheckCircle2, Sparkles } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { formatBRL } from '@/shared/lib/currency'

interface PublicConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  enviando: boolean
  fotos: number
  videos: number
  fotosInclusas: number
  videosInclusos: number
  extras: number
  valorExtras: number
  quantidadeCoberta: number
  valorCoberto: number
  novosExtras: number
  novoValor: number
}

export function PublicConfirmDialog({
  open,
  onClose,
  onConfirm,
  enviando,
  fotos,
  videos,
  fotosInclusas,
  videosInclusos,
  extras,
  valorExtras,
  quantidadeCoberta,
  valorCoberto,
  novosExtras,
  novoValor,
}: PublicConfirmDialogProps) {
  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar seleção"
      description="Revise os detalhes antes de enviar para o estúdio."
      className="rounded-[1.75rem]"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Resumo rotulo="Fotos" valor={fotos} />
          <Resumo rotulo="Vídeos" valor={videos} />
          <Resumo rotulo="Extras" valor={extras} />
        </div>

        <div className="rounded-2xl border border-[#E7DCCD] bg-[#FBF7F2] p-4 text-xs leading-relaxed text-[#7A6A59]">
          <p>
            Pacote: <strong className="text-[#2B241D]">{fotosInclusas}</strong>{' '}
            {fotosInclusas === 1 ? 'foto' : 'fotos'} e{' '}
            <strong className="text-[#2B241D]">{videosInclusos}</strong>{' '}
            {videosInclusos === 1 ? 'vídeo' : 'vídeos'} inclusos.
          </p>
          {quantidadeCoberta > 0 ? (
            <p className="mt-1">
              Já cobertos: {quantidadeCoberta} extra(s) ·{' '}
              {formatBRL(valorCoberto)}.
            </p>
          ) : null}
          {extras > 0 ? (
            <p className="mt-1">
              Extras na seleção: {extras} · {formatBRL(valorExtras)}.
            </p>
          ) : (
            <p className="mt-1 text-[#5F7A5B]">
              Nenhuma foto extra selecionada.
            </p>
          )}
          {novoValor > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E2] px-2.5 py-1 font-semibold text-[#8A5A18]">
              <Sparkles className="size-3.5" />
              A pagar agora: {novosExtras} extra(s) · {formatBRL(novoValor)}
            </p>
          ) : quantidadeCoberta > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EDF6EA] px-2.5 py-1 font-semibold text-[#4C7048]">
              <CheckCircle2 className="size-3.5" />
              Nenhuma nova cobrança
            </p>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-[#8A7863]">
          Mídias já entregues continuam obrigatórias e não podem ser trocadas.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Voltar e revisar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={enviando}
            className="bg-[#2B241D] hover:bg-[#40352B] active:bg-[#1F1914]"
          >
            <CheckCircle2 className="size-4" />
            {enviando ? 'Enviando…' : 'Confirmar envio'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-[#E7DCCD] bg-white/70 px-2 py-3">
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#A08B72]">
        {rotulo}
      </p>
      <p className="mt-1 font-display text-2xl text-[#2B241D]">{valor}</p>
    </div>
  )
}
