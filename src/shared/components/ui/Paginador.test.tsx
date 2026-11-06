import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Paginador } from '@/shared/components/ui/Paginador'

describe('Paginador', () => {
  it('exibe o intervalo e dispara a navegação', async () => {
    const onPaginaChange = vi.fn()
    const onTamanhoChange = vi.fn()

    render(
      <Paginador
        pagina={1}
        tamanho={12}
        totalItens={30}
        totalPaginas={3}
        temAnterior
        temProxima
        onPaginaChange={onPaginaChange}
        onTamanhoChange={onTamanhoChange}
      />,
    )

    expect(screen.getByText(/Exibindo/)).toHaveTextContent('13–24 de 30')
    expect(screen.getByText(/Página/)).toHaveTextContent('Página 2 de 3')

    await userEvent.click(screen.getByRole('button', { name: /Página anterior/i }))
    expect(onPaginaChange).toHaveBeenCalledWith(0)

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /Itens por página/i }),
      '24',
    )
    expect(onTamanhoChange).toHaveBeenCalledWith(24)
  })
})
