import { useState } from 'react'
import { ChevronDown, ScrollText } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { cn } from '@/shared/lib/cn'
import { ContractDocument } from '@/features/contracts/components/ContractDocument'
import {
  publicCard,
  publicDisplay,
} from '@/features/contracts/components/public/publicContractTheme'

interface PublicContractTermsProps {
  contrato: Contrato
}

/**
 * Contrato completo em acordeão.
 *
 * Reaproveita o documento imprimível do staff para que a prévia pública e a
 * impressão mostrem exatamente o mesmo conteúdo jurídico.
 */
export function PublicContractTerms({ contrato }: PublicContractTermsProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <section className={cn(publicCard, 'overflow-hidden')}>
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-cyan-50/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
          <ScrollText className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className={`${publicDisplay} block text-lg font-semibold text-cyan-950`}>
            Contrato completo
          </span>
          <span className="block text-xs text-slate-500">
            {aberto
              ? 'Toque para recolher'
              : 'Toque para ler todos os termos do contrato'}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-cyan-600 transition-transform',
            aberto && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-cyan-100 px-4 py-5 sm:px-6">
            <ContractDocument contrato={contrato} embedded />
          </div>
        </div>
      </div>
    </section>
  )
}
