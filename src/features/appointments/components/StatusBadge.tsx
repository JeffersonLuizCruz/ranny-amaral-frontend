import { STATUS_META } from '@/domain/constants'
import type { AgendamentoStatus } from '@/domain/types'
import { cn } from '@/shared/lib/cn'

interface StatusBadgeProps {
  status: AgendamentoStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}
