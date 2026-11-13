import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'

interface PublicSelectionBarProps {
  fotosSelecionadas: number
  fotosInclusas: number
  videosSelecionados: number
  videosInclusos: number
  extras: number
  valorExtras: number
  podeEnviar: boolean
  enviando: boolean
  onEnviar: () => void
}

export function PublicSelectionBar({
  fotosSelecionadas,
  fotosInclusas,
  videosSelecionados,
  videosInclusos,
  extras,
  valorExtras,
  podeEnviar,
  enviando,
  onEnviar,
}: PublicSelectionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-2xl border border-[#E7DCCD] bg-[#FFFDF9]/95 px-4 py-3 shadow-[0_24px_60px_-28px_rgba(60,42,25,0.5)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-[#A08B72]">
            Sua seleção
          </p>
          <p
            className="mt-0.5 text-sm font-semibold text-[#2B241D]"
            aria-live="polite"
          >
            {fotosSelecionadas} de {fotosInclusas}{' '}
            {fotosInclusas === 1 ? 'foto' : 'fotos'} · {videosSelecionados}/
            {videosInclusos} {videosInclusos === 1 ? 'vídeo' : 'vídeos'}
          </p>
          <p className="text-[11px] text-[#7A6A59]">
            {extras > 0
              ? `${extras} ${extras === 1 ? 'extra' : 'extras'} · ${formatBRL(valorExtras)}`
              : 'Sem extras até agora'}
          </p>
        </div>

        <Button
          onClick={onEnviar}
          disabled={!podeEnviar || enviando}
          className="h-11 w-full shrink-0 bg-[#2B241D] px-5 hover:bg-[#40352B] active:bg-[#1F1914] sm:w-auto"
        >
          <CheckCircle2 className="size-4" />
          {enviando ? 'Enviando…' : 'Enviar seleção'}
        </Button>
      </div>
    </div>
  )
}
