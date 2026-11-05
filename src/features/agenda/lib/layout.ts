import { isSameDay } from 'date-fns'

import type { AgendamentoEnsaio } from '@/domain/types'
import { endOfDay, startOfDay } from '@/shared/lib/date'

export interface PositionedAppointment {
  appointment: AgendamentoEnsaio
  /** Minutes from 00:00, clamped to the visible day. */
  startMin: number
  endMin: number
  /** Zero-based column inside its overlap group. */
  column: number
  /** Total columns in the overlap group. */
  columns: number
}

interface MinuteAppointment {
  appointment: AgendamentoEnsaio
  startMin: number
  endMin: number
  column: number
  columns: number
}

const DAY_MINUTES = 24 * 60

/**
 * Assigns side-by-side columns to appointments that overlap in time.
 *
 * Appointments are sorted by start time and split into overlap groups. Inside a
 * group, each appointment takes the first free column (greedy interval
 * partitioning), and every appointment in the group is stretched to the
 * group's total column count.
 */
export function layoutDayAppointments(
  appointments: AgendamentoEnsaio[],
  day: Date,
): PositionedAppointment[] {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  const timed = appointments
    .map((appointment) => {
      const appointmentStart = new Date(appointment.dataHoraInicio)
      const appointmentEnd = new Date(appointment.dataHoraFim)
      const startMin = isSameDay(appointmentStart, day)
        ? appointmentStart.getHours() * 60 + appointmentStart.getMinutes()
        : 0
      const endMin = isSameDay(appointmentEnd, day)
        ? appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes()
        : DAY_MINUTES

      return {
        appointment,
        startMin: Math.max(0, Math.min(startMin, DAY_MINUTES)),
        endMin: Math.max(1, Math.min(Math.max(endMin, 1), DAY_MINUTES)),
        column: 0,
        columns: 1,
      }
    })
    // Guard against appointments that start and end at the same minute.
    .map((item) =>
      item.endMin <= item.startMin ? { ...item, endMin: item.startMin + 30 } : item,
    )
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

  // Drop appointments that are fully outside of this day.
  const visible = timed.filter(
    (item) =>
      new Date(item.appointment.dataHoraFim).getTime() >= dayStart.getTime() &&
      new Date(item.appointment.dataHoraInicio).getTime() <= dayEnd.getTime(),
  )

  const result: PositionedAppointment[] = []
  let group: MinuteAppointment[] = []
  let groupEnd = -1

  const flushGroup = () => {
    if (group.length === 0) return

    const columnEnds: number[] = []

    for (const item of group) {
      let column = columnEnds.findIndex((end) => end <= item.startMin)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(item.endMin)
      } else {
        columnEnds[column] = item.endMin
      }
      item.column = column
    }

    const columns = Math.max(1, columnEnds.length)
    for (const item of group) {
      result.push({ ...item, columns })
    }

    group = []
    groupEnd = -1
  }

  for (const item of visible) {
    if (group.length > 0 && item.startMin >= groupEnd) {
      flushGroup()
    }

    group.push(item)
    groupEnd = Math.max(groupEnd, item.endMin)
  }

  flushGroup()

  return result.sort((a, b) => a.startMin - b.startMin || a.column - b.column)
}
