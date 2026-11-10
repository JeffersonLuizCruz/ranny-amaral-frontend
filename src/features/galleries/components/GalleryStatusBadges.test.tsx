import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GalleryStatusBadges } from '@/features/galleries/components/GalleryStatusBadges'

describe('GalleryStatusBadges', () => {
  it('mostra somente o status quando o ZIP ainda não foi baixado', () => {
    render(<GalleryStatusBadges status="entregue" />)

    expect(screen.getByText('Entregue')).toBeInTheDocument()
    expect(screen.queryByText('Baixada')).not.toBeInTheDocument()
  })

  it('mantém Entregue e adiciona Baixada quando o ZIP foi baixado', () => {
    render(
      <GalleryStatusBadges
        status="entregue"
        zipBaixadoEm="2026-11-10T12:00:00.000Z"
      />,
    )

    expect(screen.getByText('Entregue')).toBeInTheDocument()
    expect(screen.getByText('Baixada')).toBeInTheDocument()
  })

  it('mostra o status atual e Baixada após a entrega ser revogada', () => {
    render(
      <GalleryStatusBadges
        status="em_edicao"
        zipBaixadoEm="2026-11-10T12:00:00.000Z"
      />,
    )

    expect(screen.getByText('Em edição')).toBeInTheDocument()
    expect(screen.getByText('Baixada')).toBeInTheDocument()
  })
})
