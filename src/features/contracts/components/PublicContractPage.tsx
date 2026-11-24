import { useEffect, useState } from 'react'
import { AlertTriangle, Ban, Clock, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type {
  Contrato,
  DadosAceiteInput,
  SolicitacaoAceite,
} from '@/domain/contracts'
import { acceptanceAdapter } from '@/integrations/acceptance'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { PublicAcceptanceForm } from '@/features/contracts/components/PublicAcceptanceForm'
import { PublicAcceptanceSuccess } from '@/features/contracts/components/PublicAcceptanceSuccess'
import { PublicContractHero } from '@/features/contracts/components/public/PublicContractHero'
import {
  PublicContractLoading,
  PublicContractShell,
  PublicContractStatusScreen,
} from '@/features/contracts/components/public/PublicContractShell'
import { PublicContractSummary } from '@/features/contracts/components/public/PublicContractSummary'
import { PublicContractTerms } from '@/features/contracts/components/public/PublicContractTerms'
import { usePublicContractMeta } from '@/features/contracts/components/public/usePublicContractMeta'
import { PublicPaymentSection } from '@/features/contracts/components/PublicPaymentSection'
import { printContract } from '@/features/contracts/lib/print'
import type { AcceptanceResult } from '@/integrations/acceptance'
import type { UploadProgress } from '@/shared/upload/types'

interface PublicContractData {
  solicitacao: SolicitacaoAceite
  contrato: Contrato
}

export function PublicContractPage() {
  const { token = '' } = useParams()
  usePublicContractMeta()
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
  const studioName = contrato?.snapshot.estudio.nome

  const isAccepted =
    Boolean(success) ||
    data?.solicitacao.status === 'aceita' ||
    contrato?.statusAceite === 'aceito'
  const isExpired =
    data?.solicitacao.status === 'expirada' || contrato?.statusAceite === 'expirado'
  const isCanceled =
    data?.solicitacao.status === 'cancelada' || contrato?.statusAceite === 'cancelado'

  if (loading) {
    return <PublicContractLoading />
  }

  if (error || !contrato) {
    return (
      <PublicContractStatusScreen
        icon={AlertTriangle}
        iconClass="text-amber-600"
        title="Não foi possível abrir"
        studioName={studioName}
      >
        <p>{error || 'Link inválido ou contrato não encontrado.'}</p>
        <p className="text-xs">Solicite um novo link ao estúdio responsável.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Tentar novamente
        </button>
      </PublicContractStatusScreen>
    )
  }

  if (isExpired) {
    return (
      <PublicContractStatusScreen
        icon={Clock}
        iconClass="text-amber-600"
        title="Link expirado"
        studioName={studioName}
      >
        <p>
          O prazo para aceite deste contrato terminou. Solicite um novo link ao estúdio.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Tentar novamente
        </button>
      </PublicContractStatusScreen>
    )
  }

  if (isCanceled) {
    return (
      <PublicContractStatusScreen
        icon={Ban}
        iconClass="text-rose-600"
        title="Contrato cancelado"
        studioName={studioName}
      >
        <p>Este contrato foi cancelado pelo estúdio e não pode mais ser aceito.</p>
      </PublicContractStatusScreen>
    )
  }

  if (isAccepted) {
    if (!aceite) {
      return (
        <PublicContractStatusScreen
          icon={ShieldCheck}
          iconClass="text-emerald-600"
          title="Contrato já aceito"
          studioName={studioName}
        >
          <p>Este contrato já foi aceito. O estúdio recebeu o registro.</p>
        </PublicContractStatusScreen>
      )
    }

    return (
      <PublicContractShell studioName={studioName}>
        <div className="space-y-5">
          <PublicContractStatusBar contrato={contrato} />
          <PublicAcceptanceSuccess
            contrato={contrato}
            aceite={aceite}
            onPrint={() => printContract(contrato)}
          >
            {contrato.statusEntrada !== 'cancelado' ? (
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
        </div>
      </PublicContractShell>
    )
  }

  return (
    <PublicContractShell studioName={studioName}>
      <div className="space-y-5">
        <PublicContractHero contrato={contrato} />

        <PublicContractStatusBar contrato={contrato} />

        <PublicContractSummary contrato={contrato} />

        <PublicContractTerms contrato={contrato} />

        <PublicAcceptanceForm
          contrato={contrato}
          submitting={submitting}
          error={formError}
          onSubmit={handleAccept}
        />
      </div>
    </PublicContractShell>
  )
}

function PublicContractStatusBar({ contrato }: { contrato: Contrato }) {
  return (
    <div className="print-hidden flex flex-wrap items-center gap-2 rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-cyan-100 backdrop-blur">
      <ContractStatusBadges
        aceite={contrato.statusAceite}
        entradaStatus={contrato.statusEntrada}
        pagamento={contrato.pagamento}
        saldoStatus={contrato.statusSaldoFinal}
      />
      {acceptanceAdapter.mode === 'local' ? (
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
          Demonstração local
        </span>
      ) : null}
      <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:inline-flex">
        <ShieldCheck className="size-3" />
        Ambiente seguro
      </span>
    </div>
  )
}
