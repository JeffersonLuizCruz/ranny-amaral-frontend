import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import { PublicPhotoViewer } from '@/features/galleries/components/public/PublicPhotoViewer'

function midia(overrides: Partial<MidiaGaleria> = {}): MidiaGaleria {
  return {
    id: 'm1',
    tipo: 'foto',
    nomeArquivo: 'foto-1.jpg',
    mimeType: 'image/jpeg',
    tamanho: 100,
    status: 'original',
    finalidade: 'edicao',
    numero: 1,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    thumbUrl: 'https://storage/thumb-1.jpg',
    webUrl: 'https://storage/web-1.jpg',
    previaMarcada: false,
    disponivelParaDownload: true,
    liberacaoAutomatica: true,
    processamentoStatus: 'disponivel',
    ...overrides,
  }
}

function renderViewer(overrides: Partial<Parameters<typeof PublicPhotoViewer>[0]> = {}) {
  const onClose = vi.fn()
  const onToggle = vi.fn()
  const props = {
    midias: [midia(), midia({ id: 'm2', numero: 2, nomeArquivo: 'foto-2.jpg' })],
    initialIndex: 0,
    selectedIds: new Set<string>(),
    lockedIds: new Set<string>(),
    onToggle,
    onClose,
    ...overrides,
  }
  render(<PublicPhotoViewer {...props} />)
  return { onClose, onToggle }
}

describe('PublicPhotoViewer', () => {
  it('abre a foto, aplica zoom e permite selecionar', () => {
    const { onToggle } = renderViewer()

    expect(
      screen.getByRole('dialog', { name: 'Visualizador da galeria' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('foto-1.jpg')).toBeInTheDocument()
    expect(screen.getByText(/1 de 2/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Aumentar zoom'))
    expect(
      screen.getByAltText('foto-1.jpg').style.transform,
    ).toContain('scale(1.5)')

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar foto' }))
    expect(onToggle).toHaveBeenCalledWith('m1')
  })

  it('navega entre as fotos e fecha', () => {
    const { onClose } = renderViewer()

    fireEvent.click(screen.getByLabelText('Próxima mídia'))
    expect(screen.getByAltText('foto-2.jpg')).toBeInTheDocument()
    expect(screen.getByText(/2 de 2/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Fechar visualizador'))
    expect(onClose).toHaveBeenCalled()
  })

  it('mantém mídia já entregue bloqueada', () => {
    const { onToggle } = renderViewer({
      selectedIds: new Set(['m1']),
      lockedIds: new Set(['m1']),
    })

    const botao = screen.getByRole('button', { name: 'Já entregue' })
    expect(botao).toBeDisabled()
    fireEvent.click(botao)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
