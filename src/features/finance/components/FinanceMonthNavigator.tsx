import { addMonths, isSameMonth, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button, IconButton } from '@/shared/components/ui/Button'
import { useNow } from '@/shared/hooks/useNow'
import { formatMonthYear } from '@/shared/lib/date'

interface FinanceMonthNavigatorProps {
  month: Date
  onChange: (month: Date) => void
}

export function FinanceMonthNavigator({ month, onChange }: FinanceMonthNavigatorProps) {
  const now = useNow()
  const isCurrentMonth = isSameMonth(month, now)

  const goToPreviousMonth = () => onChange(startOfMonth(addMonths(month, -1)))
  const goToNextMonth = () => onChange(startOfMonth(addMonths(month, 1)))
  const goToToday = () => onChange(startOfMonth(new Date()))

  return (
    <div className="flex items-center gap-1">
      <IconButton label="Mês anterior" onClick={goToPreviousMonth}>
        <ChevronLeft className="size-4" />
      </IconButton>

      <span
        aria-live="polite"
        className="min-w-36 text-center text-sm font-semibold tracking-tight text-ink"
      >
        {formatMonthYear(month)}
      </span>

      <IconButton label="Próximo mês" onClick={goToNextMonth}>
        <ChevronRight className="size-4" />
      </IconButton>

      {!isCurrentMonth ? (
        <Button size="sm" variant="ghost" onClick={goToToday}>
          Hoje
        </Button>
      ) : null}
    </div>
  )
}
