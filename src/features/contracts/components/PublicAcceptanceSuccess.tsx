import { CheckCircle2, Printer } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Contrato, DadosAceite } from '@/domain/contracts'
import { Button } from '@/shared/components/ui/Button'
import { ContractDocument } from '@/features/contracts/components/ContractDocument'

interface PublicAcceptanceSuccessProps {
  contrato: Contrato
  aceite: DadosAceite
  onPrint: () => void
  children?: ReactNode
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function PublicAcceptanceSuccess({
  contrato,
  aceite,
  onPrint,
  children,
}: PublicAcceptanceSuccessProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 print-hidden">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="size-5" />
          Contrato aceito com sucesso
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/80">
          Guarde o protocolo abaixo. O estúdio também recebeu o registro do aceite.
        </p>

        <dl className="mt-3 grid gap-1 text-[11px] text-emerald-900/80 sm:grid-cols-2">
          <div>
            <dt className="text-emerald-700">Protocolo</dt>
            <dd className="font-semibold">{aceite.protocolo}</dd>
          </div>
          <div>
            <dt className="text-emerald-700">Data</dt>
            <dd className="font-semibold">{formatDateTime(aceite.aceitoEm)}</dd>
          </div>
          <div>
            <dt className="text-emerald-700">Nome</dt>
            <dd className="font-semibold">{aceite.nomeCompleto}</dd>
          </div>
          <div>
            <dt className="text-emerald-700">Documento</dt>
            <dd className="font-semibold">
              {aceite.tipoDocumento.toUpperCase()}: {aceite.documento}
            </dd>
          </div>
          <div>
            <dt className="text-emerald-700">Cidade</dt>
            <dd className="font-semibold">{aceite.cidade}</dd>
          </div>
          {aceite.hashConteudo ? (
            <div className="sm:col-span-2">
              <dt className="text-emerald-700">Hash do conteúdo</dt>
              <dd className="break-all font-mono text-[10px]">{aceite.hashConteudo}</dd>
            </div>
          ) : null}
        </dl>

        <Button className="mt-3" variant="secondary" onClick={onPrint}>
          <Printer className="size-4" />
          Imprimir comprovante
        </Button>
      </div>

      {children}

      <ContractDocument contrato={contrato} aceite={aceite} />
    </div>
  )
}
