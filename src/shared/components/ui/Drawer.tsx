import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { IconButton } from '@/shared/components/ui/Button'
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll'
import { cn } from '@/shared/lib/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * Accessible side panel built on the native <dialog> element.
 * Desktop: slides in from the right. Mobile: becomes a bottom sheet.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useLockBodyScroll(open)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'drawer-panel m-0 ml-auto h-dvh max-h-dvh w-[min(30rem,100vw)] max-w-none overflow-hidden rounded-none border-l border-line bg-surface p-0 text-ink shadow-2xl outline-none',
        'max-sm:mt-auto max-sm:h-[min(94dvh,100dvh)] max-sm:w-full max-sm:rounded-t-3xl max-sm:border-l-0',
        className,
      )}
    >
      <div className="flex h-full max-h-full flex-col">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-xs text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Fechar" size="sm" onClick={onClose} className="-mr-1 -mt-1">
            <X className="size-4" />
          </IconButton>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          {children}
        </div>
      </div>
    </dialog>
  )
}
