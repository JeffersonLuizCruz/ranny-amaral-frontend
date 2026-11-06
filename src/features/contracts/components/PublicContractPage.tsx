import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type {
  Contrato,
  DadosAceiteInput,
  SolicitacaoAceite,
} from '@/domain/contracts'
import { acceptanceAdapter } from '@/integrations/acceptance'
import type { AcceptanceResult } from '@/integrations/acceptance'
import { Button } from '@/shared/components/ui/Button'
import type { UploadProgress } from '@/shared/upload/types'
import { ContractDocument } from '@/features/contracts/components/ContractDocument'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { PublicAcceptanceForm } from '@/features/contracts/components/PublicAcceptanceForm'
import { PublicAcceptanceSuccess } from '@/features/contracts/components/PublicAcceptanceSuccess'
import { PublicPaymentSection } from '@/features/contracts/components/PublicPaymentSection'
import { printContract } from '@/features/contracts/lib/print'

interface PublicContractData {
  solicitacao: SolicitacaoAceite
  contrato: Contrato
}

export function PublicContractPage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<AcceptanceResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittingProof, setSubmittingProof] = useState(false)
  const [formError, setFormError] = useState('')
  const [proofError, setProofError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | undefined>()
  const [uploadController, setUploadController] = useState<AbortController | null>(null)

  useEffect(() => {
    let active = true

    acceptanceAdapter
      .getByToken(token)
      .then((result) => {
        if (!active) return
        if (!result) {
          setError('Link inválido ou contrato não encontrado.')
          return
        }

        setData(result)

        if (result.solicitacao.status === 'pendente') {
          void acceptanceAdapter.markViewed(token)
        }
      })
      .catch((loadError) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o contrato.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const enviarArquivoComprovante = async (file: File) => {
    const controller = new AbortController()
    setUploadController(controller)
    setSubmittingProof(true)
    setProofError('')
    setUploadProgress({
      fase: 'preparando',
      enviado: 0,
      total: file.size,
      percentual: 0,
      velocidadeBps: 0,
    })

    try {
      const result = await acceptanceAdapter.submitProof(token, file, {
        signal: controller.signal,
        onProgress: setUploadProgress,
      })
      setSuccess((atual) =>
        atual
          ? { ...atual, contrato: result.contrato, solicitacao: result.solicitacao }
          : atual,
      )
      setUploadProgress({
        fase: 'concluido',
        enviado: file.size,
        total: file.size,
        percentual: 100,
        velocidadeBps: 0,
      })
    } catch (uploadError) {
      if (controller.signal.aborted) {
        setProofError('Envio cancelado. Você pode tentar novamente.')
        setUploadProgress((atual) =>
          atual ? { ...atual, fase: 'cancelado' } : undefined,
        )
      } else {
        setProofError(
          uploadError instanceof Error
            ? uploadError.message
            : 'Não foi possível enviar o comprovante.',
        )
        setUploadProgress((atual) => (atual ? { ...atual, fase: 'erro' } : undefined))
      }
    } finally {
      setSubmittingProof(false)
      setUploadController(null)
    }
  }

  const handleAccept = async (input: DadosAceiteInput, file?: File) => {
    setSubmitting(true)
    setFormError('')

    try {
      const result = await acceptanceAdapter.accept(token, input)
      setSuccess(result)
      if (file) await enviarArquivoComprovante(file)
    } catch (acceptError) {
      setFormError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Não foi possível registrar o aceite.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitProof = async (file: File) => {
    await enviarArquivoComprovante(file)
  }

  const contrato = success?.contrato ?? data?.contrato
  const aceite =
    success?.solicitacao.dadosAceite ??
    data?.solicitacao.dadosAceite ??
    data?.contrato.aceite

  const isAccepted =
    Boolean(success) ||
    data?.solicitacao.status === 'aceita' ||
    contrato?.statusAceite === 'aceito'
  const isExpired =
    data?.solicitacao.status === 'expirada' || contrato?.statusAceite === 'expirado'
  const isCanceled =
    data?.solicitacao.status === 'cancelada' || contrato?.statusAceite === 'cancelado'

  if (loading) {
    return (
      <PublicShell>
        <div className="grid min-h-[60dvh] place-items-center">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Carregando contrato…
          </div>
        </div>
      </PublicShell>
    )
  }

  if (error || !contrato) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mt-3 text-base font-semibold text-ink">Não foi possível abrir</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {error || 'Link inválido ou contrato não encontrado.'}
          </p>
          <p className="mt-3 text-[11px] text-muted">
            Solicite um novo link ao estúdio responsável.
          </p>
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell studioName={contrato.snapshot.estudio.nome}>
      <div className="print-hidden mb-4 flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Aceite de contrato
          </p>
          <p className="text-sm font-semibold text-ink">{contrato.numero}</p>
        </div>
        <ContractStatusBadges
          aceite={contrato.statusAceite}
          pagamentoStatus={contrato.statusPagamento}
          pagamento={contrato.pagamento}
        />
        {acceptanceAdapter.mode === 'local' ? (
          <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
            Demonstração local
          </span>
        ) : null}
      </div>

      {isAccepted && aceite ? (
        <PublicAcceptanceSuccess
          contrato={contrato}
          aceite={aceite}
          onPrint={() => printContract(contrato)}
        >
          {contrato.statusPagamento === 'pendente' ? (
            <PublicPaymentSection
              contrato={contrato}
              submitting={submittingProof}
              error={proofError}
              progress={uploadProgress}
              onCancel={uploadController ? () => uploadController.abort() : undefined}
              onSubmit={handleSubmitProof}
            />
          ) : null}
        </PublicAcceptanceSuccess>
      ) : null}

      {isExpired ? (
        <StatusCard
          tone="amber"
          title="Link expirado"
          description="O prazo para aceite deste contrato terminou. Solicite um novo link ao estúdio."
        />
      ) : null}

      {isCanceled ? (
        <StatusCard
          tone="red"
          title="Contrato cancelado"
          description="Este contrato foi cancelado pelo estúdio e não pode mais ser aceito."
        />
      ) : null}

      {!isAccepted && !isExpired && !isCanceled ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <ContractDocument contrato={contrato} />
          </div>
          <aside className="print-hidden">
            <PublicAcceptanceForm
              contrato={contrato}
              submitting={submitting}
              error={formError}
              onSubmit={handleAccept}
            />
          </aside>
        </div>
      ) : null}
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
      <header className="border-b border-line bg-surface print-hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {studioName ?? 'Photoizer CRM'}
            </p>
            <p className="text-[11px] text-muted">Aceite eletrônico de contrato</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 sm:inline">
            Ambiente seguro
          </span>
        </div>
      </header>

      <main className="print-scroll mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>

      <footer className="print-hidden border-t border-line px-4 py-4 text-center text-[10px] text-muted">
        Photoizer CRM · O aceite eletrônico registra nome, documento, cidade, data e hash
        do conteúdo.
      </footer>
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
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-3 text-base font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      <Button
        className="mt-4"
        variant="secondary"
        onClick={() => window.location.reload()}
      >
        Tentar novamente
      </Button>
    </div>
  )
}
