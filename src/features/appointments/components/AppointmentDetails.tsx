import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  Ban,
  CalendarDays,
  Clock,
  FileSignature,
  FileText,
  Images,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import type { AgendamentoEnsaio, AgendamentoStatus } from '@/domain/types'
import { financeIntegration } from '@/integrations/finance'
import { whatsappReminders } from '@/integrations/whatsapp'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EntradaStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import {
  formatAppointmentDate,
  formatDuration,
  formatTimeRange,
  minutesBetween,
} from '@/shared/lib/date'
import { whatsappLink } from '@/shared/lib/whatsapp'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { FinalPaymentPanel } from '@/features/contracts/components/FinalPaymentPanel'
import { copyContractLink } from '@/features/contracts/lib/shareLink'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { GalleryStatusBadges } from '@/features/galleries/components/GalleryStatusBadges'
import { useToastStore } from '@/shared/store/toastStore'
import { useCrmLookups } from '@/features/appointments/lib/lookups'
import { StatusBadge } from '@/features/appointments/components/StatusBadge'

interface AppointmentDetailsProps {
  appointment: AgendamentoEnsaio
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: AgendamentoStatus) => void
  onCancelar: (motivo: string) => Promise<void>
  onClose: () => void
}

export function AppointmentDetails({
  appointment,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelar,
  onClose,
}: AppointmentDetailsProps) {
  const { clientesById, pacotesById } = useCrmLookups()
  const navigate = useNavigate()
  const contratos = useContractStore((state) => state.contratos)
  const cliente = appointment.clienteId
    ? clientesById.get(appointment.clienteId)
    : undefined
  const pacote = pacotesById.get(appointment.pacoteId)
  const contrato = contratos.find((item) => item.agendamentoId === appointment.id)
  const pagamento = contrato?.pagamento ?? appointment.pagamentoEntrada
  const valorEntrada = contrato?.valorEntrada ?? appointment.valorEntrada
  const percentualEntrada = contrato?.percentualEntrada ?? appointment.percentualEntrada
  const saldoRestante = contrato?.saldoRestante ?? appointment.saldoRestante
  const taxaDeslocamento = appointment.taxaDeslocamento ?? 0
  const addToast = useToastStore((state) => state.addToast)
  const galerias = useGalleryStore((state) => state.galerias)
  const createGallery = useGalleryStore((state) => state.createGallery)
  const galeria = galerias.find(
    (item) =>
      (appointment.galeriaId && item.id === appointment.galeriaId) ||
      item.agendamentoId === appointment.id,
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [enviandoCancelamento, setEnviandoCancelamento] = useState(false)
  const entradaStatus = contrato?.statusEntrada ?? appointment.statusEntrada
  const entradaLiquidada = contrato?.entradaQuitada ?? appointment.entradaQuitada
  const saldoLiquidado = contrato?.saldoQuitado ?? appointment.saldoQuitado
  const podeCriarGaleria =
    appointment.status === 'realizado' && entradaLiquidada && saldoLiquidado
  const contatoNome = cliente?.nome ?? appointment.contato?.nome
  const contatoWhatsapp = cliente?.whatsapp || appointment.contato?.whatsapp
  const message = `Olá${contatoNome ? `, ${contatoNome}` : ''}! Sobre o seu ensaio${
    pacote ? ` de ${pacote.nome}` : ''
  }:`

  const handleCreateGallery = async () => {
    try {
      await createGallery(appointment.id)
      addToast('Galeria criada. Envie as mídias para liberar a seleção.')
    } catch {
      addToast('Não foi possível criar a galeria para este ensaio.')
    }
  }

  const handleCopyContractLink = async () => {
    if (!contrato) return

    try {
      const link = await copyContractLink(contrato)
      if (link) addToast('Link do contrato copiado.')
      else addToast('Não foi possível gerar o link do contrato.')
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : 'Não foi possível copiar o link do contrato.',
      )
    }
  }

  const podeCancelar =
    appointment.status === 'reservado' || appointment.status === 'confirmado'

  const handleCancelar = async () => {
    const motivo = motivoCancelamento.trim()
    if (!motivo) return

    setEnviandoCancelamento(true)
    try {
      await onCancelar(motivo)
      setCancelando(false)
      setMotivoCancelamento('')
    } catch {
      // O drawer exibe a mensagem de erro retornada pela API.
    } finally {
      setEnviandoCancelamento(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <Badge className="bg-surface text-ink ring-line">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: pacote?.corHex ?? '#64748b' }}
            />
            {pacote?.nome ?? 'Pacote removido'}
          </Badge>
        </div>

        <h3 className="mt-2.5 text-xl font-semibold leading-snug text-ink">
          {contatoNome ?? 'Reserva sem cliente'}
        </h3>

        {contatoWhatsapp ? (
          <a
            href={whatsappLink(contatoWhatsapp, message)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Conversar no WhatsApp com ${contatoNome ?? 'o cliente'}`}
            className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
          >
            <MessageCircle className="size-4 shrink-0" />
            WhatsApp
            <span className="min-w-0 truncate font-medium text-brand-700/80">
              {contatoWhatsapp}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0" />
          </a>
        ) : (
          <p className="mt-2 text-[11px] text-muted">
            Cliente sem WhatsApp cadastrado.
          </p>
        )}
      </div>

      {contrato?.statusAceite === 'rascunho' ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink">
            <FileSignature className="size-4 text-brand-700" />
            Contrato em rascunho
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Copie o link e envie ao cliente para preencher os dados e aceitar.
          </p>
          <Button size="sm" className="mt-2" onClick={handleCopyContractLink}>
            <FileSignature className="size-3.5" />
            Copiar link do contrato
          </Button>
        </div>
      ) : null}

      <div className="space-y-3.5 text-sm">
        <DetailRow icon={CalendarDays}>
          {formatAppointmentDate(appointment.dataHoraInicio, appointment.dataHoraFim)}
        </DetailRow>

        <DetailRow icon={Clock}>
          {formatTimeRange(appointment.dataHoraInicio, appointment.dataHoraFim)}
          <span className="text-muted">
            {' '}
            ·{' '}
            {formatDuration(
              minutesBetween(appointment.dataHoraInicio, appointment.dataHoraFim),
            )}
          </span>
        </DetailRow>

        <DetailRow icon={MapPin}>{appointment.local}</DetailRow>

        <DetailRow icon={Wallet}>
          <span className="flex flex-col">
            <span>{formatBRL(appointment.valorAcordado)}</span>
            {taxaDeslocamento > 0 ? (
              <span className="text-[11px] font-normal text-muted">
                {appointment.taxaDeslocamentoRepassada
                  ? `Inclui ${formatBRL(taxaDeslocamento)} de deslocamento repassado`
                  : `${formatBRL(taxaDeslocamento)} de deslocamento absorvido pelo estúdio`}
              </span>
            ) : null}
          </span>
        </DetailRow>

        <div className="rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Entrada
            </p>
            <EntradaStatusBadge status={entradaStatus} pagamento={pagamento} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-muted">Valor da entrada</p>
              <p className="font-semibold text-ink">
                {formatBRL(valorEntrada)} ({percentualEntrada}%)
              </p>
            </div>
            <div>
              <p className="text-muted">Saldo restante</p>
              <p className="font-semibold text-ink">
                {formatBRL(saldoRestante)}
              </p>
            </div>
            <div>
              <p className="text-muted">Recebido</p>
              <p className="font-semibold text-emerald-600">
                {formatBRL(contrato?.valorRecebido ?? appointment.valorRecebido)}
              </p>
            </div>
            <div>
              <p className="text-muted">Pendente</p>
              <p className="font-semibold text-amber-600">
                {formatBRL(contrato?.valorPendente ?? appointment.valorPendente)}
              </p>
            </div>
          </div>
        </div>

        <FinalPaymentPanel
          appointment={appointment}
          contrato={contrato}
          compact
        />

        {appointment.observacoes ? (
          <DetailRow icon={FileText}>
            <span className="whitespace-pre-line">{appointment.observacoes}</span>
          </DetailRow>
        ) : null}
      </div>

      <div className="rounded-xl border border-line p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Status do atendimento
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          {appointment.status === 'confirmado' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onStatusChange('realizado')}
            >
              Marcar como realizado
            </Button>
          ) : null}
          {appointment.status === 'reservado' ? (
            <span className="text-[11px] text-muted">
              Aguardando aceite e confirmação do pagamento.
            </span>
          ) : null}
        </div>
      </div>

      {appointment.status === 'cancelado' ? (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-red-700">
            <Ban className="size-4" />
            Cancelamento
          </p>
          {appointment.cancelamentoMotivo ? (
            <p className="mt-1 whitespace-pre-line text-xs text-ink">
              {appointment.cancelamentoMotivo}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted">
              Justificativa não registrada.
            </p>
          )}
          {appointment.canceladoEm ? (
            <p className="mt-1 text-[11px] text-muted">
              {appointment.canceladoPor ?? 'Equipe do estúdio'} ·{' '}
              {new Date(appointment.canceladoEm).toLocaleString('pt-BR')}
            </p>
          ) : null}
        </div>
      ) : podeCancelar ? (
        <div className="rounded-xl border border-dashed border-red-200 p-3">
          {cancelando ? (
            <div className="space-y-2">
              <label
                htmlFor="motivo-cancelamento"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted"
              >
                Justificativa do cancelamento
              </label>
              <textarea
                id="motivo-cancelamento"
                value={motivoCancelamento}
                onChange={(event) => setMotivoCancelamento(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ex.: cliente pediu para remarcar por motivo de saúde."
                className="w-full rounded-lg border border-line bg-surface p-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={enviandoCancelamento}
                  onClick={() => {
                    setCancelando(false)
                    setMotivoCancelamento('')
                  }}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!motivoCancelamento.trim() || enviandoCancelamento}
                  onClick={handleCancelar}
                >
                  Confirmar cancelamento
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Cancelamento
                </p>
                <p className="text-[11px] text-muted">
                  Cancele o ensaio registrando a justificativa.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setCancelando(true)}
              >
                <Ban className="size-4" />
                Cancelar ensaio
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-xl border border-line p-3">
        <div className="flex items-center gap-2">
          <FileSignature className="size-4 text-muted" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Contrato
          </p>
        </div>

        {contrato ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ContractStatusBadges
                aceite={contrato.statusAceite}
                entradaStatus={contrato.statusEntrada}
                pagamento={contrato.pagamento}
                saldoStatus={contrato.statusSaldoFinal}
              />
              <span className="text-[11px] text-muted">{contrato.numero}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={handleCopyContractLink}>
                <FileSignature className="size-3.5" />
                Copiar link
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onClose()
                  navigate(`/contratos/${contrato.id}`)
                }}
              >
                Abrir contrato
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted">
              Nenhum contrato gerado. Edite o ensaio para criar o rascunho.
            </p>
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Editar ensaio
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line p-3">
        <div className="flex items-center gap-2">
          <Images className="size-4 text-muted" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Galeria
          </p>
        </div>

        {galeria ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <GalleryStatusBadges
                status={galeria.status}
                zipBaixadoEm={galeria.zipBaixadoEm}
              />
              <span className="text-[11px] text-muted">
                {galeria.midias.filter((midia) => midia.tipo === 'foto').length} fotos ·{' '}
                {galeria.midias.filter((midia) => midia.tipo === 'video').length} vídeos
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                to={`/galerias/${galeria.id}`}
                onClick={onClose}
                className="inline-flex h-8 items-center rounded-full bg-surface px-3 text-xs font-medium text-ink ring-1 ring-line transition hover:bg-canvas"
              >
                Abrir galeria
              </Link>
              {galeria.tokenSelecao ? (
                <Link
                  to={`/selecao/${galeria.tokenSelecao}`}
                  target="_blank"
                  className="inline-flex h-8 items-center rounded-full bg-brand-50 px-3 text-xs font-medium text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
                >
                  Ver link de seleção
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted">
              {podeCriarGaleria
                ? 'Nenhuma galeria criada para este ensaio.'
                : 'Marque o ensaio como realizado e registre entrada e saldo para criar a galeria.'}
            </p>
            {podeCriarGaleria ? (
              <Button size="sm" variant="secondary" onClick={handleCreateGallery}>
                <Images className="size-3.5" />
                Criar galeria
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Integrações
        </p>
        <div className="mt-2 space-y-2">
          <IntegrationRow
            icon={Wallet}
            label="Sinal / pagamento pendente"
            enabled={financeIntegration.enabled}
          />
          <IntegrationRow
            icon={MessageCircle}
            label="Lembrete automático via WhatsApp"
            enabled={whatsappReminders.enabled}
          />
        </div>
      </div>

      <div className="border-t border-line pt-4">
        {confirmingDelete ? (
          <div className="flex flex-col gap-3 rounded-xl bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-red-700">
              Excluir este ensaio permanentemente?
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="danger" onClick={onDelete}>
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
              <Button size="sm" variant="secondary" onClick={onEdit}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <p className="min-w-0 text-ink">{children}</p>
    </div>
  )
}

function IntegrationRow({
  icon: Icon,
  label,
  enabled,
}: {
  icon: LucideIcon
  label: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted">
      <Icon className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      <Badge
        className={cn(
          enabled
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-slate-100 text-slate-500 ring-slate-200',
        )}
      >
        {enabled ? 'Disponível' : 'Em breve'}
      </Badge>
    </div>
  )
}
