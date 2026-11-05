import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { AppointmentDrawer } from '@/features/appointments/components/AppointmentDrawer'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useContractCrossTabSync } from '@/features/contracts/hooks/useContractCrossTabSync'
import { useGalleryCrossTabSync } from '@/features/galleries/hooks/useGalleryCrossTabSync'
import { FloatingCreateButton } from '@/app/layout/FloatingCreateButton'
import { Header } from '@/app/layout/Header'
import { MobileBottomNav } from '@/app/layout/MobileBottomNav'
import { MobileDrawer } from '@/app/layout/MobileDrawer'
import { Sidebar } from '@/app/layout/Sidebar'
import { Toaster } from '@/shared/components/ui/Toaster'
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { registerServiceWorker } from '@/shared/lib/pwa'
import { useToastStore } from '@/shared/store/toastStore'

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const navigate = useNavigate()
  const setSidebarOpen = useAgendaStore((state) => state.setSidebarOpen)
  const setView = useAgendaStore((state) => state.setView)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)

  useKeyboardShortcuts()
  useContractCrossTabSync()
  useGalleryCrossTabSync()

  // PWA shortcuts (manifest): /agenda?action=new and /agenda?view=day
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    const viewParam = params.get('view')

    if (!action && !viewParam) return

    if (viewParam === 'month' || viewParam === 'week' || viewParam === 'day') {
      setView(viewParam)
    }
    if (action === 'new') {
      openCreateDrawer()
    }

    navigate('/agenda', { replace: true })
  }, [location.pathname, location.search, navigate, openCreateDrawer, setView])

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false)
  }, [isDesktop, setSidebarOpen])

  useEffect(() => {
    registerServiceWorker((applyUpdate) => {
      useToastStore.getState().addToast('Nova versão disponível.', {
        actionLabel: 'Atualizar',
        onAction: applyUpdate,
        duration: 15_000,
      })
    })
  }, [])

  return (
    <div className="app-shell flex h-dvh min-h-0 flex-col bg-canvas text-ink lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="print-hidden hidden min-h-0 border-r border-line lg:block">
        <Sidebar />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <main className="app-main min-h-0 flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileDrawer />
      <FloatingCreateButton />
      <MobileBottomNav />
      <AppointmentDrawer />
      <Toaster />
    </div>
  )
}
