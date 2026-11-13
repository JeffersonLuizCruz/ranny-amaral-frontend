import { describe, expect, it } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import {
  calcularResultadoSelecao,
  calcularValorExtras,
  menorValorFotoExtra,
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
    [11, 110],
    [15, 150],
  ])('aplica a faixa alcançada em %i extra(s)', (quantidade, esperado) => {
    const { valorTotal } = calcularValorExtras(
      15,
      [{ quantidadeMinima: 11, valorUnitario: 10 }],
      quantidade,
    )
    expect(valorTotal).toBe(esperado)
  })

  it('aplica a maior faixa alcançada a todas as fotos', () => {
    const { valorTotal, detalhamento } = calcularValorExtras(
      50,
      [
        { quantidadeMinima: 2, valorUnitario: 30 },
        { quantidadeMinima: 4, valorUnitario: 20 },
      ],
      5,
    )

    expect(valorTotal).toBe(100)
    expect(detalhamento).toEqual([
      { quantidade: 5, valorUnitario: 20, subtotal: 100 },
    ])
  })

  it('mostra o menor valor efetivo da tabela', () => {
    expect(menorValorFotoExtra(15, [])).toBe(15)
    expect(
      menorValorFotoExtra(15, [
        { quantidadeMinima: 3, valorUnitario: 10 },
        { quantidadeMinima: 6, valorUnitario: 8 },
      ]),
    ).toBe(8)
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
    expect(resultado.valorExtras).toBe(120)
    expect(resultado.detalhamentoExtras).toEqual([
      { quantidade: 12, valorUnitario: 10, subtotal: 120 },
    ])
  })
})
