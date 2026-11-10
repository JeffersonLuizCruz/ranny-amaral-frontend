import { useRef, useState } from 'react'
import { CheckCircle2, Paperclip, Upload, Wallet } from 'lucide-react'

import type { PedidoExtras } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { UploadProgress } from '@/shared/components/ui/UploadProgress'
import { mensagemDeErro } from '@/shared/api/errors'
import { formatBRL } from '@/shared/lib/currency'
import { useToastStore } from '@/shared/store/toastStore'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'
import { PROOF_ACCEPT, validateProofFile } from '@/features/contracts/lib/proofFile'
import { enviarComprovanteExtras } from '@/features/galleries/api/galeriaUploadApi'

interface ExtrasPaymentCardProps {
  token: string
  extras: PedidoExtras
  onChange: (extras: PedidoExtras) => void
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ExtrasPaymentCard({ token, extras, onChange }: ExtrasPaymentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgressValue>()
  const [erro, setErro] = useState('')

  const pendente = extras.status === 'pendente'

  const selecionar = (selecionado: File | null) => {
    if (!selecionado) return
    const problema = validateProofFile(selecionado)
    if (problema) {
      setErro(`${selecionado.name}: ${problema}`)
      return
    }
    setErro('')
    setFile(selecionado)
  }

  const enviar = async () => {
    if (!file) return
    setUploading(true)
    setErro('')
    setProgress(undefined)
    try {
      const atualizado = await enviarComprovanteExtras(token, file, {
        onProgress: setProgress,
      })
      onChange(atualizado)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      addToast('Comprovante dos extras enviado.')
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setUploading(false)
      setProgress(undefined)
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4 text-left shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Wallet className="size-4 text-brand-600" />
        Pagamento dos extras
      </h2>
      <p className="mt-1 text-xs text-muted">
        {extras.quantidadeFotos} foto(s) extra(s) · {formatBRL(extras.valorTotal)}
      </p>
      {extras.detalhamento && extras.detalhamento.length > 0 ? (
        <p className="mt-1 text-[10px] leading-relaxed text-muted">
          {extras.detalhamento
            .map(
              (faixa) =>
                `${faixa.quantidade} × ${formatBRL(faixa.valorUnitario)} = ${formatBRL(faixa.subtotal)}`,
            )
            .join(' · ')}
        </p>
      ) : null}

      {pendente ? (
        <>
          {extras.chavePix ? (
            <p className="mt-2 text-[11px] text-muted">
              Pix: <span className="font-medium text-ink">{extras.chavePix}</span>
            </p>
          ) : (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
              Chave Pix dos extras não configurada. Fale com o estúdio.
            </p>
          )}

          {extras.instrucoesPagamento ? (
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              {extras.instrucoesPagamento}
            </p>
          ) : null}

          {extras.comprovanteEnviadoEm ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-800">
                <CheckCircle2 className="size-3.5" />
                Comprovante enviado em {formatDateTime(extras.comprovanteEnviadoEm)}
              </p>
              {extras.comprovanteNome ? (
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                  <Paperclip className="size-3" />
                  {extras.comprovanteNome}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-muted">
                Aguardando confirmação do estúdio. Você pode substituir o comprovante se precisar.
              </p>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept={PROOF_ACCEPT}
            className="sr-only"
            onChange={(event) => selecionar(event.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-3 w-full rounded-xl border border-dashed border-line bg-canvas/60 px-3 py-4 text-center transition hover:border-brand-300 hover:bg-brand-50/30 disabled:opacity-60"
          >
            <Upload className="mx-auto size-5 text-muted" />
            <span className="mt-1 block text-[11px] font-medium text-ink">
              {extras.comprovanteEnviadoEm
                ? 'Substituir comprovante'
                : 'Anexar comprovante Pix'}
            </span>
            <span className="block text-[10px] text-muted">
              PDF, JPEG, PNG ou WebP até 10 MB
            </span>
          </button>

          {file ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
              <Paperclip className="size-3" />
              {file.name}
            </p>
          ) : null}

          {progress ? <UploadProgress progress={progress} /> : null}

          {erro ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {erro}
            </p>
          ) : null}

          <Button
            className="mt-3"
            fullWidth
            disabled={!file || uploading}
            onClick={() => void enviar()}
          >
            <CheckCircle2 className="size-4" />
            {uploading ? 'Enviando…' : 'Enviar comprovante'}
          </Button>
        </>
      ) : null}

      {extras.status === 'pago' ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-700">
          Pagamento confirmado pelo estúdio.
        </p>
      ) : null}

      {extras.status === 'isento' ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
          Extras isentos pelo estúdio.
        </p>
      ) : null}

      {extras.status === 'cancelado' ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
          Pedido de extras cancelado.
        </p>
      ) : null}
    </section>
  )
}
