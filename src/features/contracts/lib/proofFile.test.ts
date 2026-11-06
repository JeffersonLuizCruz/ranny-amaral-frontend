import { describe, expect, it } from 'vitest'

import { validateProofFile } from '@/features/contracts/lib/proofFile'

function arquivo(tamanho: number, tipo: string): File {
  return { size: tamanho, type: tipo } as File
}

describe('validateProofFile', () => {
  it.each(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])(
    'aceita %s',
    (tipo) => {
      expect(validateProofFile(arquivo(1024, tipo))).toBeNull()
    },
  )

  it('rejeita tipo não permitido', () => {
    expect(validateProofFile(arquivo(1024, 'text/plain'))).toContain('PDF')
  })

  it('rejeita arquivo vazio', () => {
    expect(validateProofFile(arquivo(0, 'application/pdf'))).toContain('vazio')
  })

  it('rejeita arquivo acima de 10 MB', () => {
    expect(validateProofFile(arquivo(10 * 1024 * 1024 + 1, 'application/pdf'))).toContain(
      '10 MB',
    )
  })
})
