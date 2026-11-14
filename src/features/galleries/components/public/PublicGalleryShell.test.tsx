import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PublicGalleryShell } from '@/features/galleries/components/public/PublicGalleryShell'

describe('PublicGalleryShell', () => {
  it('exibe aviso de proteção e bloqueia indexação', () => {
    render(
      <PublicGalleryShell studioName="Estúdio Teste">
        <p>Conteúdo</p>
      </PublicGalleryShell>,
    )

    expect(
      screen.getByText(/Imagens protegidas por direitos autorais/),
    ).toBeInTheDocument()
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute('content'),
    ).toBe('noindex, nofollow, noarchive')
  })
})
