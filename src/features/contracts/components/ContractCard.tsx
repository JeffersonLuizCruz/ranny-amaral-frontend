import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, FileCheck2, FileSignature, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Contrato } from '@/domain/contracts'
import { contratoComComprovanteEmAnalise } from '@/domain/contractQueues'
import { Button } from '@/shared/components/ui/Button'
import { mensagemDeErro } from '@/shared/api/errors'
import { formatBRL } from '@/shared/lib/currency'
import { formatAppointmentDate } from '@/shared/lib/date'
import { isValidWhatsApp, whatsappLink } from '@/shared/lib/whatsapp'
import { useToastStore } from '@/shared/store/toastStore'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { copyContractLink, getContractLink } from '@/features/contracts/lib/shareLink'
import {
  mensagemLembreteContrato,
  tipoLembreteContrato,
} from '@/features/contracts/lib/whatsappReminder'

interface ContractCardProps {
  contrato: Contrato
}

export function ContractCard({ contrato }: ContractCardProps) {
  const { snapshot } = contrato
  const addToast = useToastStore((state) => state.addToast)
  const emAnalise = contratoComComprovanteEmAnalise(contrato)
  const tipoLembrete = tipoLembreteContrato(contrato)
  const whatsapp = snapshot.cliente.whatsapp
  const podeLembrar = Boolean(
    tipoLembrete && whatsapp && isValidWhatsApp(whatsapp),
  )

  const handleCopyLink = async () => {
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

  const handleWhatsApp = async () => {
    if (!whatsapp || !isValidWhatsApp(whatsapp)) {
      addToast('Cliente sem WhatsApp cadastrado.')
      return
    }

    // Abre a aba antes do await para não ser bloqueada pelo navegador no celular.
    const janela = window.open('about:blank', '_blank')
    if (!janela) {
      addToast('Permita pop-ups para abrir o WhatsApp.')
      return
    }

    try {
      const link = await getContractLink(contrato)
      const mensagem = link ? mensagemLembreteContrato(contrato, link) : null

      if (!link || !mensagem) {
        janela.close()
        addToast('Não foi possível gerar o lembrete.')
        return
      }

      janela.location.replace(whatsappLink(whatsapp, mensagem))
      janela.opener = null
    } catch (error) {
      janela.close()
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <FileSignature className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{contrato.numero}</p>
            <p className="truncate text-[11px] text-muted">
              {format(new Date(contrato.dataEmissao), "d 'de' MMM 'de' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <ContractStatusBadges
          aceite={contrato.statusAceite}
          entradaStatus={contrato.statusEntrada}
          pagamento={contrato.pagamento}
          saldoStatus={contrato.statusSaldoFinal}
        />
      </div>

      {emAnalise && contrato.pagamento.comprovante ? (
        <p className="mt-1.5 text-[11px] text-muted">
          Comprovante enviado{' '}
          {formatDistanceToNow(
            new Date(contrato.pagamento.comprovante.enviadoEm),
            { addSuffix: true, locale: ptBR },
          )}
        </p>
      ) : null}

      <div className="mt-3 border-t border-line pt-3">
        <p className="truncate text-sm font-medium text-ink">{snapshot.cliente.nome}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {snapshot.pacote?.nome ?? 'Pacote não vinculado'}
        </p>
        {snapshot.agendamento ? (
          <p className="mt-1 truncate text-[11px] text-muted">
            {formatAppointmentDate(
              snapshot.agendamento.dataHoraInicio,
              snapshot.agendamento.dataHoraFim,
            )}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full bg-canvas px-2 py-1 font-semibold text-ink ring-1 ring-line">
          Total {formatBRL(contrato.valorTotal)}
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
          Recebido {formatBRL(contrato.valorRecebido)}
        </span>
        <span
          className={
            contrato.valorPendente > 0
              ? 'rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700 ring-1 ring-amber-200'
              : 'rounded-full bg-canvas px-2 py-1 text-muted ring-1 ring-line'
          }
        >
          Pendente {formatBRL(contrato.valorPendente)}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {emAnalise ? (
          <Link
            to={`/contratos/${contrato.id}#pagamento`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <FileCheck2 className="size-3.5" />
            Conferir comprovante
          </Link>
        ) : null}
        <Link
          to={`/contratos/${contrato.id}`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-brand-50 px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
        >
          Abrir contrato
        </Link>
        <Button size="sm" variant="ghost" onClick={handleCopyLink}>
          <Copy className="size-3.5" />
          Copiar link
        </Button>
        {podeLembrar ? (
          <Button size="sm" variant="ghost" onClick={handleWhatsApp}>
            <MessageCircle className="size-3.5" />
            Lembrar no WhatsApp
          </Button>
        ) : null}
      </div>
    </article>
  )
}
