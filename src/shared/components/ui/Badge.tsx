import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  )
}
