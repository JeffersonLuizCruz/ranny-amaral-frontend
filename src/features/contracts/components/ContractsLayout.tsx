import { Link, Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

const TABS = [
  { to: '/contratos', label: 'Contratos' },
  { to: '/contratos/modelos', label: 'Modelos' },
  { to: '/contratos/configuracoes', label: 'Dados do estúdio' },
]

function isTabActive(pathname: string, to: string): boolean {
  if (to === '/contratos') {
    return (
      pathname === '/contratos' ||
      (pathname.startsWith('/contratos/') &&
        !pathname.startsWith('/contratos/modelos') &&
        !pathname.startsWith('/contratos/configuracoes'))
    )
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}

export function ContractsLayout() {
  const location = useLocation()

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="shrink-0 border-b border-line bg-surface px-4 pt-4 sm:px-6 print-hidden">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Gestão de contratos
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Gere documentos, acompanhe o aceite e mantenha o histórico dos ensaios.
          </p>
        </div>

        <nav
          aria-label="Seções de contratos"
          className="mt-3 flex gap-1 overflow-x-auto pb-0.5"
        >
          {TABS.map((tab) => {
            const active = isTabActive(location.pathname, tab.to)

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
                    : 'text-muted hover:bg-slate-100 hover:text-ink',
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="print-scroll min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
