import { describe, expect, it } from 'vitest'

import {
  createEmptyAcceptanceValues,
  validateAcceptanceForm,
} from '@/features/contracts/lib/documentValidation'

describe('acceptance form', () => {
  it('envia a autorização de uso de imagem junto do aceite', () => {
    const values = {
      ...createEmptyAcceptanceValues('Marina Alves', ''),
      documento: '529.982.247-25',
      cidade: 'São Paulo',
      aceite: true,
      autorizaUsoImagem: true,
    }

    const result = validateAcceptanceForm(values)

    expect(result.draft?.autorizaUsoImagem).toBe(true)
  })

  it('mantém a autorização desmarcada por padrão', () => {
    const values = {
      ...createEmptyAcceptanceValues('Marina Alves', ''),
      documento: '529.982.247-25',
      cidade: 'São Paulo',
      aceite: true,
    }

    const result = validateAcceptanceForm(values)

    expect(result.draft?.autorizaUsoImagem).toBe(false)
  })
})
