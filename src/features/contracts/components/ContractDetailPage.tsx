import {
  ArrowLeft,
  Copy,
  FileSignature,
  Printer,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { galleryIntegration } from '@/integrations/gallery'
import { financeIntegration } from '@/integrations/finance'
import { whatsappReminders } from '@/integrations/whatsapp'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { formatBRL } from '@/shared/lib/currency'
import {
  formatAppointmentDate,
  formatDuration,
  formatTimeRange,
} from '@/shared/lib/date'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { ContractAcceptancePanel } from '@/features/contracts/components/ContractAcceptancePanel'
import { ContractPreview } from '@/features/contracts/components/ContractPreview'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { ContractPaymentPanel } from '@/features/contracts/components/ContractPaymentPanel'
import { FinalPaymentPanel } from '@/features/contracts/components/FinalPaymentPanel'
import { ContractTimeline } from '@/features/contracts/components/ContractTimeline'
import { copyContractLink } from '@/features/contracts/lib/shareLink'
import { printContract } from '@/features/contracts/lib/print'

export function ContractDetailPage() {
  const { contratoId = '' } = useParams()
  const navigate = useNavigate()
  const contratos = useContractStore((state) => state.contratos)
  const carregando = useContractStore((state) => state.carregando)
  const cancelContract = useContractStore((state) => state.cancelContract)
  const deleteContract = useContractStore((state) => state.deleteContract)
  const duplicateContract = useContractStore((state) => state.duplicateContract)
  const recarregarContrato = useContractStore((state) => state.recarregarContrato)
  const addToast = useToastStore((state) => state.addToast)

  const contrato = contratos.find((item) => item.id === contratoId)

  useEffect(() => {
    if (!contrato) {
      void recarregarContrato(contratoId).catch(() => undefined)
    }
  }, [contrato, contratoId, recarregarContrato])

  if (!contrato && carregando) {
    return (
      <div className="p-4 sm:p-6">
        <p className="py-10 text-center text-sm text-muted">Carregando contrato…</p>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={FileSignature}
          title="Contrato não encontrado"
          description="Ele pode ter sido excluído ou o link está incorreto."
          action={
            <Link
              to="/contratos"
              className="inline-flex h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-medium text-white"
            >
              Voltar para contratos
            </Link>
          }
        />
      </div>
    )
  }

  const canDelete = contrato.statusAceite === 'rascunho'
  const canCancel = !['aceito', 'cancelado'].includes(contrato.statusAceite)
  const canDuplicate = ['aceito', 'cancelado', 'expirado'].includes(contrato.statusAceite)

  const handleCopyLink = async () => {
    try {
      const link = await copyContractLink(contrato)
      if (link) {
        addToast('Link do contrato copiado.')
        await recarregarContrato(contrato.id).catch(() => undefined)
      } else {
        addToast('Não foi possível gerar o link do contrato.')
      }
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleCancel = async () => {
    const confirmed = window.confirm(`Cancelar o contrato ${contrato.numero}?`)
    if (!confirmed) return

    try {
      await cancelContract(contrato.id)
      addToast('Contrato cancelado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`Excluir o rascunho ${contrato.numero}?`)
    if (!confirmed) return

    try {
      await deleteContract(contrato.id)
      addToast('Contrato excluído.')
      navigate('/contratos')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDuplicate = async () => {
    try {
      const duplicado = await duplicateContract(contrato.id)
      if (!duplicado) return
      addToast('Contrato duplicado como rascunho.')
      navigate(`/contratos/${duplicado.id}`)
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2 print-hidden">
        <Link
          to="/contratos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Contratos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-ink">{contrato.numero}</span>
        <ContractStatusBadges
          aceite={contrato.statusAceite}
          pagamentoStatus={contrato.statusPagamento}
          pagamento={contrato.pagamento}
        />

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            <Copy className="size-3.5" />
            Copiar link
          </Button>
          <Button size="sm" variant="secondary" onClick={() => printContract(contrato)}>
            <Printer className="size-3.5" />
            Imprimir
          </Button>
          {canDuplicate ? (
            <Button size="sm" variant="secondary" onClick={handleDuplicate}>
              <Copy className="size-3.5" />
              Duplicar
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleCancel}
            >
              <XCircle className="size-3.5" />
              Cancelar
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          ) : null}
        </div>
      </div>

      <div className="contract-detail-layout grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <ContractPreview contrato={contrato} aceite={contrato.aceite} />
        </div>

        <aside className="space-y-4 print-hidden">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Resumo</h3>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div>
                <dt className="text-muted">Cliente</dt>
                <dd className="font-medium text-ink">{contrato.snapshot.cliente.nome}</dd>
              </div>
              <div>
                <dt className="text-muted">Pacote</dt>
                <dd className="font-medium text-ink">
                  {contrato.snapshot.pacote?.nome ?? '—'}
                  {contrato.snapshot.pacote
                    ? ` · ${formatDuration(contrato.snapshot.pacote.duracaoMinutos)}`
                    : ''}
                </dd>
              </div>
              {contrato.snapshot.agendamento ? (
                <div>
                  <dt className="text-muted">Ensaio</dt>
                  <dd className="font-medium text-ink">
                    {formatAppointmentDate(
                      contrato.snapshot.agendamento.dataHoraInicio,
                      contrato.snapshot.agendamento.dataHoraFim,
                    )}
                  </dd>
                  <dd className="text-muted">
                    {formatTimeRange(
                      contrato.snapshot.agendamento.dataHoraInicio,
                      contrato.snapshot.agendamento.dataHoraFim,
                    )}{' '}
                    · {contrato.snapshot.agendamento.local}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted">Valor total</dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatBRL(contrato.valorTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Entrada</dt>
                <dd className="font-medium text-ink">
                  {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)
                </dd>
              </div>
              <div>
                <dt className="text-muted">Saldo restante</dt>
                <dd className="font-medium text-ink">{formatBRL(contrato.saldoRestante)}</dd>
              </div>
              <div>
                <dt className="text-muted">Forma de pagamento</dt>
                <dd className="font-medium text-ink">{contrato.formaPagamento}</dd>
              </div>
              {contrato.condicoesPagamento ? (
                <div>
                  <dt className="text-muted">Condições</dt>
                  <dd className="text-ink">{contrato.condicoesPagamento}</dd>
                </div>
              ) : null}
              {contrato.observacoes ? (
                <div>
                  <dt className="text-muted">Observações</dt>
                  <dd className="whitespace-pre-line text-ink">{contrato.observacoes}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <ContractAcceptancePanel contrato={contrato} />

          <ContractPaymentPanel contrato={contrato} />

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Saldo final</h3>
            <p className="mt-0.5 text-[11px] text-muted">
              Recebimento manual do restante, via Pix ou dinheiro.
            </p>
            <div className="mt-3">
              <FinalPaymentPanel contrato={contrato} compact />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Histórico</h3>
            <div className="mt-3">
              <ContractTimeline contrato={contrato} />
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-line bg-canvas/60 p-4">
            <h3 className="text-sm font-semibold text-ink">Integrações</h3>
            <div className="mt-2 space-y-2 text-[11px] text-muted">
              <IntegrationRow
                icon={Wallet}
                label="Sinal / cobrança"
                enabled={financeIntegration.enabled}
              />
              <IntegrationRow
                icon={FileSignature}
                label="Assinatura certificada"
                enabled={false}
              />
              <IntegrationRow
                icon={FileSignature}
                label="Galeria e entrega"
                enabled={galleryIntegration.enabled}
              />
              <IntegrationRow
                icon={FileSignature}
                label="Lembrete WhatsApp"
                enabled={whatsappReminders.enabled}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function IntegrationRow({
  icon: Icon,
  label,
  enabled,
}: {
  icon: typeof Wallet
  label: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      <Badge
        className={
          enabled
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-slate-100 text-slate-500 ring-slate-200'
        }
      >
        {enabled ? 'Ativo' : 'Em breve'}
      </Badge>
    </div>
  )
}
