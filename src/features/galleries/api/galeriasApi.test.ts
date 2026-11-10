import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('@/shared/api/httpClient', () => ({
  http: { post },
  apiUrl: (path: string) => `/api/v1${path}`,
}))

import {
  prepararDownloadSelecao,
  urlZipPublico,
} from '@/features/galleries/api/galeriasApi'

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

describe('prepararDownloadSelecao', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('solicita o token do ZIP de fotos selecionadas ao backend', async () => {
    const resposta = {
      url: '/public/galerias/downloads/abc/selecao.zip',
      expiraEm: '2026-01-01T00:10:00.000Z',
      quantidade: 3,
    }
    post.mockResolvedValue(resposta)

    await expect(prepararDownloadSelecao('galeria-1')).resolves.toEqual(resposta)
    expect(post).toHaveBeenCalledWith('/galerias/galeria-1/selecao/download')
  })
})
