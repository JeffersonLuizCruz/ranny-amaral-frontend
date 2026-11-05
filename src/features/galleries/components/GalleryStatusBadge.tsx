import { GALERIA_STATUS_META, type GaleriaStatus } from '@/domain/galleries'
import { cn } from '@/shared/lib/cn'

export function GalleryStatusBadge({
  status,
  className,
}: {
  status: GaleriaStatus
  className?: string
}) {
  const meta = GALERIA_STATUS_META[status]

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
