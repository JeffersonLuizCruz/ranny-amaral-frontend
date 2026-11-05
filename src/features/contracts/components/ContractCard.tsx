import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, FileSignature } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Contrato } from '@/domain/contracts'
import { Button } from '@/shared/components/ui/Button'
import { formatBRL } from '@/shared/lib/currency'
import { formatAppointmentDate } from '@/shared/lib/date'
import { useToastStore } from '@/shared/store/toastStore'
import { ContractStatusBadges } from '@/features/contracts/components/ContractStatusBadge'
import { copyContractLink } from '@/features/contracts/lib/shareLink'

interface ContractCardProps {
  contrato: Contrato
}

export function ContractCard({ contrato }: ContractCardProps) {
  const { snapshot } = contrato
  const addToast = useToastStore((state) => state.addToast)

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
          pagamentoStatus={contrato.statusPagamento}
          pagamento={contrato.pagamento}
        />
      </div>

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
          {formatBRL(contrato.valorTotal)}
        </span>
        <span className="rounded-full bg-canvas px-2 py-1 text-muted ring-1 ring-line">
          Entrada {formatBRL(contrato.valorEntrada)}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
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
      </div>
    </article>
  )
}
