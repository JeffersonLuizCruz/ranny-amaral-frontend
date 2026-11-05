import { useState } from 'react'
import { addMonths, format, isSameDay, isSameMonth, isToday, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { IconButton } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  formatMonthYear,
  fromDateKey,
  getMonthMatrix,
  toDateKey,
  WEEKDAY_INITIALS,
} from '@/shared/lib/date'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'

interface MiniCalendarProps {
  onSelect?: () => void
}

export function MiniCalendar({ onSelect }: MiniCalendarProps) {
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const setSelectedDate = useAgendaStore((state) => state.setSelectedDate)
  const selected = fromDateKey(selectedDate)

  const [cursor, setCursor] = useState(() => startOfMonth(selected))
  const days = getMonthMatrix(cursor)

  return (
    <div className="select-none px-1">
      <div className="mb-1 flex items-center justify-between pl-2">
        <span className="text-xs font-semibold text-ink">{formatMonthYear(cursor)}</span>
        <div className="flex items-center">
          <IconButton
            label="Mês anterior"
            size="sm"
            onClick={() => setCursor((current) => addMonths(current, -1))}
          >
            <ChevronLeft className="size-3.5" />
          </IconButton>
          <IconButton
            label="Próximo mês"
            size="sm"
            onClick={() => setCursor((current) => addMonths(current, 1))}
          >
            <ChevronRight className="size-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAY_INITIALS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden="true"
            className="grid h-6 place-items-center text-[10px] font-medium text-muted"
          >
            {label}
          </span>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor)
          const isSelected = isSameDay(day, selected)
          const today = isToday(day)

          return (
            <button
              key={toDateKey(day)}
              type="button"
              aria-label={format(day, 'PPPP', { locale: ptBR })}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedDate(day)
                onSelect?.()
              }}
              className={cn(
                'mx-auto grid size-7 place-items-center rounded-full text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                !inMonth && 'text-slate-300 hover:bg-slate-50',
                inMonth && !isSelected && !today && 'text-ink hover:bg-slate-100',
                today && !isSelected && 'font-semibold text-brand-700 ring-1 ring-brand-200',
                isSelected && 'bg-brand-600 font-semibold text-white shadow-sm',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
