import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import { PublicMediaGrid } from '@/features/galleries/components/public/PublicMediaGrid'

const midia = {
  id: 'm1',
  tipo: 'foto',
  nomeArquivo: 'foto.jpg',
  mimeType: 'image/jpeg',
  tamanho: 100,
  status: 'original',
  finalidade: 'edicao',
  numero: 1,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  thumbUrl: 'https://storage/thumb.jpg',
  previaMarcada: true,
  processamentoStatus: 'disponivel',
} as MidiaGaleria

describe('PublicMediaGrid', () => {
  it('bloqueia clique direito e arrastar da imagem', () => {
    render(<PublicMediaGrid midias={[midia]} onToggle={vi.fn()} />)

    const imagem = screen.getByAltText('foto.jpg')
    expect(imagem).toHaveAttribute('draggable', 'false')

    const contexto = createEvent.contextMenu(imagem)
    fireEvent(imagem, contexto)
    expect(contexto.defaultPrevented).toBe(true)

    const arrastar = createEvent.dragStart(imagem)
    fireEvent(imagem, arrastar)
    expect(arrastar.defaultPrevented).toBe(true)
  })
})
