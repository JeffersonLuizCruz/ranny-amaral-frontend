import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PasswordInput } from '@/shared/components/ui/PasswordInput'

describe('PasswordInput', () => {
  it('alterna entre senha oculta e visível', () => {
    render(<PasswordInput aria-label="Senha" defaultValue="segredo" />)

    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('mantém o botão desabilitado quando o campo está desabilitado', () => {
    render(
      <PasswordInput aria-label="Senha" defaultValue="segredo" disabled />,
    )

    expect(
      screen.getByRole('button', { name: 'Mostrar senha' }),
    ).toBeDisabled()
  })
})
