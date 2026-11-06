import { describe, expect, it } from 'vitest'

import { urlZipPublico } from '@/features/galleries/api/galeriasApi'

describe('urlZipPublico', () => {
  it.each(['editada', 'original'] as const)(
    'monta a URL do ZIP com a versão %s',
    (versao) => {
      expect(urlZipPublico('tok-1', versao)).toBe(
        `/api/v1/public/galerias/tok-1/download-zip?versao=${versao}`,
      )
    },
  )
})
