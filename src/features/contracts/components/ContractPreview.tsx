import type { Contrato, DadosAceite } from '@/domain/contracts'
import { cn } from '@/shared/lib/cn'
import { ContractDocument } from '@/features/contracts/components/ContractDocument'

interface ContractPreviewProps {
  contrato: Contrato
  aceite?: DadosAceite
  className?: string
}

export function ContractPreview({ contrato, aceite, className }: ContractPreviewProps) {
  return (
    <div className={cn('contract-preview rounded-2xl bg-canvas p-2 sm:p-4', className)}>
      <ContractDocument contrato={contrato} aceite={aceite} />
    </div>
  )
}
