import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { CalendarView } from '@/domain/types'
import { Button, IconButton } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'

const VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
]

export function ViewSwitcher({ className }: { className?: string }) {
  const view = useAgendaStore((state) => state.view)
  const setView = useAgendaStore((state) => state.setView)

  return (
    <div
      role="group"
      aria-label="Visualização da agenda"
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-surface p-0.5',
        className,
      )}
    >
      {VIEWS.map((option) => {
        const active = view === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setView(option.value)}
            className={cn(
              'h-8 flex-1 rounded-full px-3 text-xs font-medium transition-colors sm:flex-none',
              active
                ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
                : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function DateNavigation() {
  const goToday = useAgendaStore((state) => state.goToday)
  const navigate = useAgendaStore((state) => state.navigate)

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="sm" onClick={goToday}>
        Hoje
      </Button>

      <div className="inline-flex items-center rounded-full border border-line bg-surface">
        <IconButton
          label="Período anterior"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-r-none"
        >
          <ChevronLeft className="size-4" />
        </IconButton>
        <span aria-hidden="true" className="h-4 w-px bg-line" />
        <IconButton
          label="Próximo período"
          size="sm"
          onClick={() => navigate(1)}
          className="rounded-l-none"
        >
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}
