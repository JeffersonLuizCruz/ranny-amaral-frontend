import { useEffect, useRef } from 'react'

import { Sidebar } from '@/app/layout/Sidebar'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll'
import { cn } from '@/shared/lib/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MobileDrawer() {
  const open = useAgendaStore((state) => state.sidebarOpen)
  const setSidebarOpen = useAgendaStore((state) => state.setSidebarOpen)
  const panelRef = useRef<HTMLDivElement>(null)

  useLockBodyScroll(open)

  // Move focus into the drawer and restore it when it closes.
  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    const timeout = window.setTimeout(() => panelRef.current?.focus(), 50)

    return () => {
      window.clearTimeout(timeout)
      previousFocus?.focus?.()
    }
  }, [open])

  // Esc to close + a minimal focus trap.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setSidebarOpen])

  return (
    <div
      className={cn(
        'print-hidden fixed inset-0 z-50 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 left-0 w-[min(86vw,320px)] max-w-full overflow-hidden bg-surface shadow-2xl outline-none transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          onNavigate={() => setSidebarOpen(false)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  )
}
