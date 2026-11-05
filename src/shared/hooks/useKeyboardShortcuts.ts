import { useEffect } from 'react'

import { useAgendaStore } from '@/features/agenda/store/agendaStore'

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]'

/** Google Calendar-style keyboard shortcuts. */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (target?.closest(EDITABLE_SELECTOR)) return

      const state = useAgendaStore.getState()
      if (state.drawer.mode || state.sidebarOpen) return
      if (document.querySelector('dialog[open]')) return

      switch (event.key.toLowerCase()) {
        case 't':
          event.preventDefault()
          state.goToday()
          break
        case 'm':
          event.preventDefault()
          state.setView('month')
          break
        case 'w':
          event.preventDefault()
          state.setView('week')
          break
        case 'd':
          event.preventDefault()
          state.setView('day')
          break
        case 'n':
          event.preventDefault()
          state.openCreateDrawer(state.selectedDate, '09:00')
          break
        case 'arrowleft':
          event.preventDefault()
          state.navigate(-1)
          break
        case 'arrowright':
          event.preventDefault()
          state.navigate(1)
          break
        default:
          return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
