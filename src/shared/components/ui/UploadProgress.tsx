import { UploadCloud, X } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'

interface UploadProgressProps {
  progress: UploadProgressValue
  onCancel?: () => void
}

const FASE_LABEL: Record<UploadProgressValue['fase'], string> = {
  preparando: 'Calculando integridade…',
  enviando: 'Enviando arquivo…',
  concluindo: 'Concluindo upload…',
  concluido: 'Upload concluído.',
  erro: 'Falha no upload.',
  cancelado: 'Upload cancelado.',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatVelocidade(bytesPorSegundo: number): string {
  if (bytesPorSegundo <= 0) return ''
  if (bytesPorSegundo < 1024 * 1024) {
    return `${(bytesPorSegundo / 1024).toFixed(0)} KB/s`
  }
  return `${(bytesPorSegundo / (1024 * 1024)).toFixed(1)} MB/s`
}

/**
 * Barra de progresso real do upload.
 *
 * O percentual vem dos eventos `upload.onprogress` de cada parte; em uploads
 * multipart o progresso e agregado e limitado pela concorrencia configurada.
 */
export function UploadProgress({ progress, onCancel }: UploadProgressProps) {
  const ativo = progress.fase === 'preparando' || progress.fase === 'enviando' || progress.fase === 'concluindo'
  const cor =
    progress.fase === 'erro'
      ? 'bg-red-500'
      : progress.fase === 'cancelado'
        ? 'bg-slate-400'
        : 'bg-brand-600'

  return (
    <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
      <div className="flex items-center gap-2">
        <UploadCloud className="size-4 shrink-0 text-muted" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
          {FASE_LABEL[progress.fase]}
        </p>
        <span className="text-[11px] font-semibold text-ink">{progress.percentual}%</span>
        {ativo && onCancel ? (
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0 text-muted"
            onClick={onCancel}
            aria-label="Cancelar upload"
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${cor}`}
          style={{ width: `${progress.percentual}%` }}
          role="progressbar"
          aria-valuenow={progress.percentual}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <p className="mt-1.5 text-[10px] text-muted">
        {formatBytes(progress.enviado)} de {formatBytes(progress.total)}
        {progress.velocidadeBps > 0 ? ` · ${formatVelocidade(progress.velocidadeBps)}` : ''}
        {progress.restanteSegundos && progress.restanteSegundos > 0
          ? ` · ~${progress.restanteSegundos}s restantes`
          : ''}
      </p>
    </div>
  )
}
