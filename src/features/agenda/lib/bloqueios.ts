import { startOfMonth, startOfWeek } from 'date-fns'

import type { BloqueioAgenda, CalendarView } from '@/domain/types'
import {
  addDays,
  endOfDay,
  isSameDay,
  startOfDay,
} from '@/shared/lib/date'

export const DAY_MINUTES = 24 * 60

export interface BloqueioNoDia {
  bloqueio: BloqueioAgenda
  /** Minutos desde 00:00, já recortados para o dia. */
  startMin: number
  endMin: number
}

/**
 * Recorta os bloqueios que intersectam o dia.
 *
 * O intervalo é semiaberto: um bloqueio que termina às 00:00 do dia seguinte
 * cobre o dia inteiro, mas não invade o próximo.
 */
export function bloqueiosNoDia(
  bloqueios: BloqueioAgenda[],
  day: Date,
): BloqueioNoDia[] {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = endOfDay(day).getTime()

  return bloqueios
    .filter((bloqueio) => {
      const inicio = new Date(bloqueio.inicio).getTime()
      const fim = new Date(bloqueio.fim).getTime()
      return inicio <= dayEnd && fim > dayStart
    })
    .map((bloqueio) => {
      const inicio = new Date(bloqueio.inicio)
      const fim = new Date(bloqueio.fim)
      const startMin = isSameDay(inicio, day)
        ? inicio.getHours() * 60 + inicio.getMinutes()
        : 0
      const endMin = isSameDay(fim, day)
        ? fim.getHours() * 60 + fim.getMinutes()
        : DAY_MINUTES

      return {
        bloqueio,
        startMin: Math.max(0, Math.min(startMin, DAY_MINUTES)),
        endMin: Math.max(1, Math.min(Math.max(endMin, 1), DAY_MINUTES)),
      }
    })
    .filter((item) => item.endMin > item.startMin)
    .sort((a, b) => a.startMin - b.startMin)
}

export function bloqueioNoHorario(
  bloqueios: BloqueioAgenda[],
  day: Date,
  time: string,
): BloqueioNoDia | undefined {
  const [horas = 0, minutos = 0] = time.split(':').map(Number)
  const minuto = horas * 60 + minutos

  return bloqueiosNoDia(bloqueios, day).find(
    (item) => minuto >= item.startMin && minuto < item.endMin,
  )
}

export function diaInteiroBloqueado(
  bloqueios: BloqueioAgenda[],
  day: Date,
): boolean {
  return bloqueiosNoDia(bloqueios, day).some(
    (item) => item.startMin === 0 && item.endMin === DAY_MINUTES,
  )
}

/** Intervalo de datas coberto pela visão atual do calendário. */
export function periodoVisivel(
  date: Date,
  view: CalendarView,
): { inicio: Date; fim: Date } {
  if (view === 'month') {
    const inicio = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
    return { inicio, fim: endOfDay(addDays(inicio, 41)) }
  }

  if (view === 'week') {
    const inicio = startOfWeek(date, { weekStartsOn: 0 })
    return { inicio, fim: endOfDay(addDays(inicio, 6)) }
  }

  return { inicio: startOfDay(date), fim: endOfDay(date) }
}
