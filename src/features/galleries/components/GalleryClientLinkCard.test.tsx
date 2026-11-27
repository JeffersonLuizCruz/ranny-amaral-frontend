import type { ComponentProps } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GalleryClientLinkCard } from '@/features/galleries/components/GalleryClientLinkCard'

const URL_CLIENTE = 'https://ranny.test/galeria/tok-123'

function props(
  overrides: Partial<ComponentProps<typeof GalleryClientLinkCard>> = {},
): ComponentProps<typeof GalleryClientLinkCard> {
  return {
    status: 'em_selecao',
    url: URL_CLIENTE,
    prazoEm: '2026-12-01T00:00:00.000Z',
    podeReabrirSelecao: true,
    onPublicar: vi.fn(),
    onCopiar: vi.fn(),
    onCompartilhar: vi.fn(),
    onRenovar: vi.fn(),
    onRevogar: vi.fn(),
    onReabrir: vi.fn(),
    ...overrides,
  }
}

describe('GalleryClientLinkCard', () => {
  it('mostra o link e as ações principais em um único bloco', () => {
    render(<GalleryClientLinkCard {...props()} />)

    expect(screen.getByText('Link do cliente')).toBeInTheDocument()
    expect(screen.getByText(URL_CLIENTE)).toBeInTheDocument()
    expect(screen.getByText('Seleção aberta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enviar ao cliente' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir link do cliente' })).toHaveAttribute(
      'href',
      URL_CLIENTE,
    )
  })

  it('publica a seleção quando ainda não há link', () => {
    const onPublicar = vi.fn()
    render(
      <GalleryClientLinkCard
        {...props({ url: undefined, prazoEm: undefined, onPublicar })}
      />,
    )

    expect(screen.getByText('Não publicado')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copiar link' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Publicar seleção' }))
    expect(onPublicar).toHaveBeenCalledTimes(1)
  })

  it('esconde as ações raras no menu', () => {
    const onRenovar = vi.fn()
    render(<GalleryClientLinkCard {...props({ onRenovar })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Mais ações do link' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Renovar link' }))

    expect(onRenovar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('só oferece revogar entrega quando a galeria está entregue', () => {
    const { rerender } = render(<GalleryClientLinkCard {...props()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Mais ações do link' }))
    expect(
      screen.queryByRole('menuitem', { name: 'Revogar entrega' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Reabrir seleção' }),
    ).toBeInTheDocument()

    rerender(<GalleryClientLinkCard {...props({ status: 'entregue' })} />)

    expect(screen.getByText('Entregue')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Revogar entrega' }),
    ).toBeInTheDocument()
  })
})
