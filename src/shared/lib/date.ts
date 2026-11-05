import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isValid,
  parse,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { AgendamentoEnsaio, CalendarView } from '@/domain/types'

/** Calendar weeks start on Sunday (Google Calendar default). */
export const WEEK_STARTS_ON = 0 as const
export const DATE_KEY_FORMAT = 'yyyy-MM-dd'

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
export const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const

export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

export function fromDateKey(key: string): Date {
  return parse(key, DATE_KEY_FORMAT, new Date())
}

export function isDateKey(value: string): boolean {
  return isValid(fromDateKey(value))
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** 42 days (6 weeks) covering the month of `date`. */
export function getMonthMatrix(date: Date): Date[] {
  const firstDay = startOfWeek(startOfMonth(date), { weekStartsOn: WEEK_STARTS_ON })
  return Array.from({ length: 42 }, (_, index) => addDays(firstDay, index))
}

export function getWeekDays(date: Date): Date[] {
  const firstDay = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index))
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })
}

export function shiftDate(date: Date, view: CalendarView, direction: 1 | -1): Date {
  if (view === 'month') return addMonths(date, direction)
  if (view === 'week') return addWeeks(date, direction)
  return addDays(date, direction)
}

export function formatViewTitle(date: Date, view: CalendarView, compact = false): string {
  if (view === 'month') {
    return capitalize(format(date, "MMMM 'de' yyyy", { locale: ptBR }))
  }

  if (view === 'day') {
    if (compact) {
      return capitalize(format(date, "EEE, d 'de' MMM", { locale: ptBR }).replace('.', ''))
    }
    return capitalize(format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }))
  }

  const start = getWeekStart(date)
  const end = addDays(start, 6)

  if (compact) {
    if (isSameMonth(start, end)) {
      return `${format(start, 'd', { locale: ptBR })} – ${format(end, "d 'de' MMM", {
        locale: ptBR,
      })}`
    }
    return `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(
      end,
      "d 'de' MMM",
      { locale: ptBR },
    )}`
  }

  if (isSameMonth(start, end)) {
    return `${format(start, 'd', { locale: ptBR })} – ${format(
      end,
      "d 'de' MMMM 'de' yyyy",
      { locale: ptBR },
    )}`
  }

  if (isSameYear(start, end)) {
    return `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(
      end,
      "d 'de' MMM 'de' yyyy",
      { locale: ptBR },
    )}`
  }

  return `${format(start, "d 'de' MMM 'de' yyyy", { locale: ptBR })} – ${format(
    end,
    "d 'de' MMM 'de' yyyy",
    { locale: ptBR },
  )}`
}

export function formatMonthYear(date: Date): string {
  return capitalize(format(date, "MMMM 'de' yyyy", { locale: ptBR }))
}

export function formatDayLong(date: Date): string {
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: ptBR }))
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

export function formatTimeValue(date: Date): string {
  return format(date, 'HH:mm')
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatAppointmentDate(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startLabel = capitalize(format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }))

  if (isSameDay(startDate, endDate)) return startLabel

  return `${startLabel} – ${capitalize(
    format(endDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }),
  )}`
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

export function minutesBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.round((end - start) / 60_000))
}

export function minutesSinceStartOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function combineDateAndTime(dateKeyValue: string, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return set(fromDateKey(dateKeyValue), { hours, minutes, seconds: 0, milliseconds: 0 })
}

export function defaultEndTime(start: Date): Date {
  return addMinutes(start, 60)
}

/** True when the appointment intersects the given calendar day. */
export function appointmentOccursOnDay(appointment: AgendamentoEnsaio, day: Date): boolean {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = endOfDay(day).getTime()
  const start = new Date(appointment.dataHoraInicio).getTime()
  const end = new Date(appointment.dataHoraFim).getTime()

  return start <= dayEnd && end >= dayStart
}

export function sortAppointments(appointments: AgendamentoEnsaio[]): AgendamentoEnsaio[] {
  return [...appointments].sort(
    (a, b) =>
      new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime(),
  )
}

export function appointmentsForDay(
  appointments: AgendamentoEnsaio[],
  day: Date,
): AgendamentoEnsaio[] {
  return sortAppointments(appointments.filter((appointment) => appointmentOccursOnDay(appointment, day)))
}

export { addDays, addMinutes, endOfDay, isSameDay, isToday, startOfDay }
