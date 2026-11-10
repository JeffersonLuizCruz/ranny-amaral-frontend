import type { GaleriaStatus } from '@/domain/galleries'
import { GalleryStatusBadge } from '@/features/galleries/components/GalleryStatusBadge'
import { cn } from '@/shared/lib/cn'

export function GalleryStatusBadges({
  status,
  zipBaixadoEm,
  className,
}: {
  status: GaleriaStatus
  zipBaixadoEm?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <GalleryStatusBadge status={status} />
      {zipBaixadoEm ? <GalleryStatusBadge status="baixada" /> : null}
    </div>
  )
}
