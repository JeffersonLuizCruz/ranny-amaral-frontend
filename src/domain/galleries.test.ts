import { describe, expect, it } from 'vitest'

import { GALERIA_FILTRO_ORDER, GALERIA_STATUS_META } from '@/domain/galleries'

describe('GALERIA_FILTRO_ORDER', () => {
  it('deixa Baixadas imediatamente antes de Cancelada', () => {
    const ultimo = GALERIA_FILTRO_ORDER[GALERIA_FILTRO_ORDER.length - 1]
    const penultimo = GALERIA_FILTRO_ORDER[GALERIA_FILTRO_ORDER.length - 2]

    expect(penultimo).toBe('baixadas')
    expect(ultimo).toBe('cancelada')
  })
})

describe('GALERIA_STATUS_META', () => {
  it('usa as cores solicitadas para cada fluxo', () => {
    expect(GALERIA_STATUS_META.aguardando_upload.badge).toContain('blue')
    expect(GALERIA_STATUS_META.em_selecao.badge).toContain('red')
    expect(GALERIA_STATUS_META.selecao_enviada.badge).toContain('slate')
    expect(GALERIA_STATUS_META.em_edicao.badge).toContain('purple')
    expect(GALERIA_STATUS_META.entregue.badge).toContain('emerald')
    expect(GALERIA_STATUS_META.baixada.badge).toContain('orange')
    expect(GALERIA_STATUS_META.cancelada.badge).toContain('red')
  })
})
