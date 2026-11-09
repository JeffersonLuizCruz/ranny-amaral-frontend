import { LogOut, Menu, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/authStore'
import { DateNavigation, ViewSwitcher } from '@/features/agenda/components/AgendaToolbar'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { IconButton } from '@/shared/components/ui/Button'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { formatViewTitle, fromDateKey } from '@/shared/lib/date'

const PAGE_TITLES: Record<string, string> = {
  '/agenda': 'Agenda',
  '/pacotes': 'Pacotes',
  '/clientes': 'Clientes',
  '/contratos': 'Contratos',
  '/galerias': 'Galerias',
  '/financeiro': 'Financeiro',
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = useAuthStore((state) => state.usuario)
  const logout = useAuthStore((state) => state.logout)
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const view = useAgendaStore((state) => state.view)
  const setSidebarOpen = useAgendaStore((state) => state.setSidebarOpen)
  const online = useOnlineStatus()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isAgenda = location.pathname.startsWith('/agenda')

  const pageTitle = Object.entries(PAGE_TITLES).find(
    ([path]) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
  )?.[1]

  const title = isAgenda
    ? formatViewTitle(fromDateKey(selectedDate), view, !isDesktop)
    : (pageTitle ?? 'Photoizer CRM')

  return (
    <header className="print-hidden z-30 shrink-0 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="flex h-16 items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
        <IconButton
          label="Abrir menu"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </IconButton>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          {!online ? (
            <span className="hidden shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200 md:inline">
              Offline
            </span>
          ) : null}
        </div>

        {isAgenda ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <DateNavigation />
            <div className="hidden md:block">
              <ViewSwitcher />
            </div>
          </div>
        ) : null}

        <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-line pl-2">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-muted sm:flex">
            <UserRound className="size-4" />
            {usuario?.nome ?? 'Conta'}
          </span>
          <IconButton
            label="Sair"
            onClick={() => {
              void logout().finally(() => navigate('/login', { replace: true }))
            }}
          >
            <LogOut className="size-4" />
          </IconButton>
        </div>
      </div>

      {isAgenda ? (
        <div className="flex items-center gap-2 px-3 pb-3 md:hidden">
          <ViewSwitcher className="w-full" />
          {!online ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
              Offline
            </span>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
