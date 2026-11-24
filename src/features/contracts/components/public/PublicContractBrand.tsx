import { cn } from '@/shared/lib/cn'

interface PublicContractBrandProps {
  nome?: string | null
  className?: string
}

/**
 * Selo da marca exibido no topo da página pública do contrato.
 *
 * A logo é um asset fixo empacotado no frontend; o selo branco mantém a arte
 * legível sobre o gradiente ciano do hero e na impressão.
 */
export function PublicContractBrand({ nome, className }: PublicContractBrandProps) {
  return (
    <div
      className={cn(
        'relative inline-flex max-w-full items-center justify-center overflow-hidden rounded-2xl bg-white/95 px-4 py-3 shadow-sm shadow-cyan-200/50 ring-1 ring-cyan-100 backdrop-blur',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400"
      />
      <img
        src="/branding/logo-ranny-amaral.png"
        alt={nome ? `Logo de ${nome}` : 'Logo do estúdio'}
        className="h-10 w-auto max-w-[220px] object-contain sm:h-14"
        draggable={false}
      />
    </div>
  )
}
