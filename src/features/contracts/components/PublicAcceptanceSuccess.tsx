import { CheckCircle2, Printer } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Contrato, DadosAceite } from '@/domain/contracts'
import { ContractDocument } from '@/features/contracts/components/ContractDocument'
import { PublicContractBrand } from '@/features/contracts/components/public/PublicContractBrand'
import {
  publicCard,
  publicDisplay,
} from '@/features/contracts/components/public/publicContractTheme'

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
  const estudio = contrato.snapshot.estudio

  return (
    <div className="space-y-5">
      <section className={`${publicCard} print-hidden p-6 text-center sm:p-8`}>
        <div className="mb-5 flex justify-center">
          <PublicContractBrand nome={estudio.nome} />
        </div>

        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className={`${publicDisplay} mt-4 text-2xl font-bold text-cyan-950`}>
          Contrato aceito com sucesso!
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Recebemos seu aceite para {estudio.nome}. Guarde o protocolo abaixo; o estúdio
          também recebeu o registro.
        </p>

        <dl className="mt-5 grid gap-2 rounded-2xl bg-cyan-50/70 p-4 text-left text-xs sm:grid-cols-2">
          <div>
            <dt className="text-cyan-700">Protocolo</dt>
            <dd className="font-semibold text-cyan-950">{aceite.protocolo}</dd>
          </div>
          <div>
            <dt className="text-cyan-700">Data</dt>
            <dd className="font-semibold text-cyan-950">{formatDateTime(aceite.aceitoEm)}</dd>
          </div>
          <div>
            <dt className="text-cyan-700">Nome</dt>
            <dd className="font-semibold text-cyan-950">{aceite.nomeCompleto}</dd>
          </div>
          <div>
            <dt className="text-cyan-700">Documento</dt>
            <dd className="font-semibold text-cyan-950">
              {aceite.tipoDocumento.toUpperCase()}: {aceite.documento}
            </dd>
          </div>
          <div>
            <dt className="text-cyan-700">Cidade</dt>
            <dd className="font-semibold text-cyan-950">{aceite.cidade}</dd>
          </div>
          {aceite.hashConteudo ? (
            <div className="sm:col-span-2">
              <dt className="text-cyan-700">Hash do conteúdo</dt>
              <dd className="break-all font-mono text-[10px] text-cyan-950">
                {aceite.hashConteudo}
              </dd>
            </div>
          ) : null}
        </dl>

        <button
          type="button"
          onClick={onPrint}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          <Printer className="size-4" />
          Imprimir comprovante
        </button>
      </section>

      {children}

      <ContractDocument contrato={contrato} aceite={aceite} />
    </div>
  )
}
