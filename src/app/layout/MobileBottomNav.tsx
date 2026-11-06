import { CalendarDays, Images, LayoutDashboard, Menu, Package, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { cn } from '@/shared/lib/cn'

const ITEMS = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pacotes', label: 'Pacotes', icon: Package, end: false },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/galerias', label: 'Galerias', icon: Images, end: false },
]

export function MobileBottomNav() {
  const setSidebarOpen = useAgendaStore((state) => state.setSidebarOpen)

  return (
    <nav
      aria-label="Navegação principal"
      className="print-hidden safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-6">
        {ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-muted hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />
                  ) : null}
                  <Icon className="size-5" strokeWidth={isActive ? 2.2 : 1.9} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted transition-colors hover:text-ink"
        >
          <Menu className="size-5" strokeWidth={1.9} />
          Mais
        </button>
      </div>
    </nav>
  )
}
