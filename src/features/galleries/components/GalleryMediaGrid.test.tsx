import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'

function midia(overrides: Partial<MidiaGaleria> = {}): MidiaGaleria {
  return {
    id: 'midia-1',
    tipo: 'foto',
    nomeArquivo: 'foto.jpg',
    mimeType: 'image/jpeg',
    tamanho: 1,
    status: 'original',
    finalidade: 'edicao',
    numero: 7,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    processamentoStatus: 'disponivel',
    ...overrides,
  }
}

describe('GalleryMediaGrid', () => {
  it('exibe o número da foto quando a numeração está ativa', () => {
    render(<GalleryMediaGrid midias={[midia()]} numerarFotos />)

    expect(screen.getByText('007')).toBeInTheDocument()
  })

  it('não numera vídeos', () => {
    render(
      <GalleryMediaGrid
        midias={[midia({ id: 'video-1', tipo: 'video', numero: 2, nomeArquivo: 'video.mp4' })]}
        numerarFotos
      />,
    )

    expect(screen.queryByText('002')).not.toBeInTheDocument()
  })

  it('marca a foto selecionada no modo somente leitura', () => {
    render(
      <GalleryMediaGrid
        midias={[midia()]}
        numerarFotos
        selectedIds={new Set(['midia-1'])}
      />,
    )

    expect(screen.getByText('007').closest('div')).toHaveClass('ring-2')
  })

  it('oferece reprocessamento quando a mídia falhou', () => {
    const onReprocessar = vi.fn()
    const falha = midia({
      processamentoStatus: 'falha',
      erroProcessamento: 'duplicate key value violates unique constraint',
    })

    render(<GalleryMediaGrid midias={[falha]} onReprocessar={onReprocessar} />)

    expect(screen.getByText('Falha ao processar')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Reprocessar foto.jpg' }),
    )
    expect(onReprocessar).toHaveBeenCalledWith(falha)
  })

  it('não oferece reprocessamento quando a mídia está disponível', () => {
    render(<GalleryMediaGrid midias={[midia()]} onReprocessar={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Reprocessar foto.jpg' }),
    ).not.toBeInTheDocument()
  })
})
