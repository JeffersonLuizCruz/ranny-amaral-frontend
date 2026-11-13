import { describe, expect, it } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import {
  calcularResultadoSelecao,
  calcularValorExtras,
  numerosDasFotosSelecionadas,
} from '@/features/galleries/lib/selection'

function foto(id: string, numero: number): MidiaGaleria {
  return {
    id,
    tipo: 'foto',
    nomeArquivo: `${id}.jpg`,
    mimeType: 'image/jpeg',
    tamanho: 1,
    status: 'original',
    finalidade: 'edicao',
    numero,
    uploadedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('numerosDasFotosSelecionadas', () => {
  it('devolve os números em ordem, ignorando mídias ausentes', () => {
    const fotos = [foto('a', 3), foto('b', 1), foto('c', 7)]

    expect(numerosDasFotosSelecionadas(fotos, ['c', 'a', 'inexistente'])).toEqual([
      3, 7,
    ])
  })

  it('devolve lista vazia sem seleção', () => {
    expect(numerosDasFotosSelecionadas([foto('a', 1)], [])).toEqual([])
  })
})

describe('calcularValorExtras', () => {
  it('usa o preço base quando não há faixas', () => {
    expect(calcularValorExtras(50, [], 3)).toEqual({
      valorTotal: 150,
      detalhamento: [{ quantidade: 3, valorUnitario: 50, subtotal: 150 }],
    })
  })

  it.each([
    [0, 0],
    [1, 15],
    [10, 150],
    [11, 160],
    [15, 200],
  ])('calcula progressivamente %i extra(s)', (quantidade, esperado) => {
    const { valorTotal } = calcularValorExtras(
      15,
      [{ quantidadeMinima: 11, valorUnitario: 10 }],
      quantidade,
    )
    expect(valorTotal).toBe(esperado)
  })

  it('detalha múltiplas faixas sem sobrepor intervalos', () => {
    const { valorTotal, detalhamento } = calcularValorExtras(
      50,
      [
        { quantidadeMinima: 2, valorUnitario: 30 },
        { quantidadeMinima: 4, valorUnitario: 20 },
      ],
      5,
    )

    expect(valorTotal).toBe(150)
    expect(detalhamento).toEqual([
      { quantidade: 1, valorUnitario: 50, subtotal: 50 },
      { quantidade: 2, valorUnitario: 30, subtotal: 60 },
      { quantidade: 2, valorUnitario: 20, subtotal: 40 },
    ])
  })
})

describe('calcularResultadoSelecao', () => {
  it('considera as faixas congeladas nas condições', () => {
    const resultado = calcularResultadoSelecao(13, 0, {
      fotosInclusas: 1,
      videosInclusos: 0,
      valorFotoExtra: 15,
      faixasFotoExtra: [{ quantidadeMinima: 11, valorUnitario: 10 }],
    })

    expect(resultado.fotosExtras).toBe(12)
    expect(resultado.valorExtras).toBe(170)
    expect(resultado.detalhamentoExtras).toEqual([
      { quantidade: 10, valorUnitario: 15, subtotal: 150 },
      { quantidade: 2, valorUnitario: 10, subtotal: 20 },
    ])
  })
})
