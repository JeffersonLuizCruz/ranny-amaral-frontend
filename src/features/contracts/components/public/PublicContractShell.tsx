import type { ComponentType, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { PublicContractBackdrop } from '@/features/contracts/components/public/PublicContractBackdrop'
import { PublicContractBrand } from '@/features/contracts/components/public/PublicContractBrand'
import {
  publicCard,
  publicDisplay,
} from '@/features/contracts/components/public/publicContractTheme'

interface PublicContractShellProps {
  studioName?: string
  children: ReactNode
}

/**
 * Moldura visual da página pública do contrato.
 *
 * O bloqueio de indexação/referrer fica em `usePublicContractMeta`, para valer
 * também nos estados de loading, erro e expiração.
 */
export function PublicContractShell({ studioName, children }: PublicContractShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <PublicContractBackdrop />

      <main className="print-scroll relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 print:max-w-none">
        {children}
      </main>

      <footer className="print-hidden relative z-10 px-4 pb-8 text-center text-[10px] leading-relaxed text-cyan-900/60">
        <p>{studioName ?? 'Estúdio de Fotografia'} · Aceite eletrônico de contrato</p>
        <p>Documento gerado eletronicamente com registro de nome, documento, cidade, data e hash.</p>
      </footer>
    </div>
  )
}

export function PublicContractLoading() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <PublicContractBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <PublicContractBrand />
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-cyan-900 shadow-sm ring-1 ring-cyan-100 backdrop-blur">
          <Loader2 className="size-4 animate-spin" />
          Carregando contrato…
        </div>
      </div>
    </div>
  )
}

interface PublicContractStatusScreenProps {
  icon: ComponentType<{ className?: string }>
  iconClass: string
  title: string
  studioName?: string
  children: ReactNode
}

export function PublicContractStatusScreen({
  icon: Icon,
  iconClass,
  title,
  studioName,
  children,
}: PublicContractStatusScreenProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <PublicContractBackdrop />
      <div
        className={cn(
          publicCard,
          'relative z-10 w-full max-w-md p-8 text-center',
        )}
      >
        <div className="mb-6 flex justify-center">
          <PublicContractBrand nome={studioName} />
        </div>
        <span
          className={cn(
            'mx-auto grid size-16 place-items-center rounded-full bg-white/80 ring-1 ring-cyan-100',
            iconClass,
          )}
        >
          <Icon className="size-8" />
        </span>
        <h1 className={`${publicDisplay} mt-4 text-xl font-bold text-cyan-950`}>{title}</h1>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-500">{children}</div>
      </div>
    </div>
  )
}
