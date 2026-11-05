import { Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useAgendaStore } from '@/features/agenda/store/agendaStore'

export function FloatingCreateButton() {
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const location = useLocation()

  if (location.pathname !== '/agenda') return null

  return (
    <button
      type="button"
      aria-label="Novo ensaio"
      onClick={() => openCreateDrawer()}
      className="print-hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-float transition hover:bg-brand-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 lg:hidden"
    >
      <Plus className="size-6" />
    </button>
  )
}
