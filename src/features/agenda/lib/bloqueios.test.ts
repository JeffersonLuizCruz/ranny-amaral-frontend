import { describe, expect, it } from 'vitest'

import type { BloqueioAgenda } from '@/domain/types'
import {
  DAY_MINUTES,
  bloqueioNoHorario,
  bloqueiosNoDia,
  diaInteiroBloqueado,
  periodoVisivel,
} from '@/features/agenda/lib/bloqueios'

function bloqueio(
  inicio: Date,
  fim: Date,
  extras: Partial<BloqueioAgenda> = {},
): BloqueioAgenda {
  return {
    id: `bloqueio-${inicio.getTime()}`,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    diaInteiro: false,
    data: '2026-12-10',
    horaInicio: '00:00',
    horaFim: '00:00',
    motivo: 'Indisponível',
    createdAt: inicio.toISOString(),
    updatedAt: inicio.toISOString(),
    ...extras,
  }
}

describe('bloqueiosNoDia', () => {
  const dia = new Date(2026, 11, 10, 12, 0)

  it('recorta um intervalo dentro do dia em minutos', () => {
    const item = bloqueio(
      new Date(2026, 11, 10, 14, 0),
      new Date(2026, 11, 10, 18, 0),
    )

    const [recortado] = bloqueiosNoDia([item], dia)

    expect(recortado.startMin).toBe(14 * 60)
    expect(recortado.endMin).toBe(18 * 60)
  })

  it('cobre o dia inteiro quando termina à meia-noite seguinte', () => {
    const item = bloqueio(
      new Date(2026, 11, 10, 0, 0),
      new Date(2026, 11, 11, 0, 0),
      { diaInteiro: true },
    )

    const [recortado] = bloqueiosNoDia([item], dia)

    expect(recortado.startMin).toBe(0)
    expect(recortado.endMin).toBe(DAY_MINUTES)
    expect(diaInteiroBloqueado([item], dia)).toBe(true)
  })

  it('recorta um bloqueio que começou no dia anterior', () => {
    const item = bloqueio(
      new Date(2026, 11, 9, 22, 0),
      new Date(2026, 11, 10, 2, 0),
    )

    const [recortado] = bloqueiosNoDia([item], dia)

    expect(recortado.startMin).toBe(0)
    expect(recortado.endMin).toBe(120)
  })

  it('ignora bloqueios de outros dias', () => {
    const item = bloqueio(
      new Date(2026, 11, 12, 10, 0),
      new Date(2026, 11, 12, 12, 0),
    )

    expect(bloqueiosNoDia([item], dia)).toHaveLength(0)
  })
})

describe('bloqueioNoHorario', () => {
  const dia = new Date(2026, 11, 10, 12, 0)
  const item = bloqueio(
    new Date(2026, 11, 10, 14, 0),
    new Date(2026, 11, 10, 18, 0),
  )

  it('encontra o bloqueio dentro do intervalo', () => {
    expect(bloqueioNoHorario([item], dia, '15:30')?.bloqueio.id).toBe(item.id)
  })

  it('trata o fim como limite aberto', () => {
    expect(bloqueioNoHorario([item], dia, '18:00')).toBeUndefined()
  })

  it('ignora horários fora do intervalo', () => {
    expect(bloqueioNoHorario([item], dia, '13:59')).toBeUndefined()
  })
})

describe('periodoVisivel', () => {
  it('cobre a matriz de 6 semanas no mês', () => {
    const { inicio, fim } = periodoVisivel(new Date(2026, 11, 10), 'month')

    expect(inicio.getDay()).toBe(0)
    const dias = (fim.getTime() - inicio.getTime()) / 86_400_000
    expect(dias).toBeGreaterThanOrEqual(41)
    expect(dias).toBeLessThan(42)
  })

  it('cobre exatamente o dia na visão diária', () => {
    const { inicio, fim } = periodoVisivel(new Date(2026, 11, 10), 'day')

    expect(inicio.getDate()).toBe(10)
    expect(fim.getDate()).toBe(10)
  })
})
