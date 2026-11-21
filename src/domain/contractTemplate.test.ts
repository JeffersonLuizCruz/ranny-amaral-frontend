import { describe, expect, it } from 'vitest'

import {
  createSampleContractContext,
  resolveContractText,
  unknownContractVariables,
} from '@/domain/contractTemplate'

describe('contractTemplate — deslocamento', () => {
  it('resolve a descrição quando a taxa é repassada', () => {
    const base = createSampleContractContext()
    const contexto = {
      ...base,
      contrato: { ...base.contrato, valorTotal: 250 },
    }

    const texto = resolveContractText('{{deslocamento.descricao}}', contexto)

    expect(texto).toContain('50,00')
    expect(texto).toContain('repassada ao contratante')
    expect(texto).toContain('250,00')
    expect(texto).not.toContain('{{')
  })

  it('deixa a descrição vazia quando a taxa é absorvida', () => {
    const contexto = {
      ...createSampleContractContext(),
      deslocamento: {
        valor: 50,
        repassado: false,
        valorCobrado: 0,
        valorAbsorvido: 50,
      },
    }

    expect(resolveContractText('{{deslocamento.descricao}}', contexto)).toBe('')
    expect(resolveContractText('{{deslocamento.valor}}', contexto)).toContain('50,00')
  })

  it('reconhece os novos tokens como variáveis conhecidas', () => {
    expect(
      unknownContractVariables(
        '{{deslocamento.valor}} {{deslocamento.descricao}}',
      ),
    ).toEqual([])
  })
})
