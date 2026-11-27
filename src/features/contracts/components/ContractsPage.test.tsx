import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContractsPage } from '@/features/contracts/components/ContractsPage'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import type { Role, Usuario } from '@/features/auth/types'
import type { Pagina } from '@/shared/api/types'
import type { Contrato } from '@/domain/contracts'

function montarUsuario(role: Role): Usuario {
  return {
    id: 'u1',
    nome: role === 'admin' ? 'Admin' : 'Gestor',
    email: `${role}@teste.com`,
    role,
    ativo: true,
    deveTrocarSenha: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

const paginaVazia: Pagina<Contrato> = {
  itens: [],
  pagina: 0,
  tamanho: 12,
  totalItens: 0,
  totalPaginas: 0,
  temAnterior: false,
  temProxima: false,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ContractsPage />
    </MemoryRouter>,
  )
}

describe('ContractsPage', () => {
  const carregarPaginaContratos = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    carregarPaginaContratos.mockResolvedValue(undefined)
    useContractStore.setState({
      contratos: [],
      paginaContratos: paginaVazia,
      carregarPaginaContratos,
    })
    useAuthStore.setState({ usuario: montarUsuario('admin') })
  })

  it('admin vê busca, filas e o botão de filtros avançados', () => {
    renderPage()

    expect(screen.getByLabelText('Buscar contrato')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cliente não aceitou/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Falta pagar a entrada/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Comprovantes para aprovar/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Abrir filtros avançados/ }),
    ).toBeInTheDocument()
  })

  it('gestor vê as filas sem busca nem filtros avançados', () => {
    useAuthStore.setState({ usuario: montarUsuario('gestor') })

    renderPage()

    expect(screen.queryByLabelText('Buscar contrato')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cliente não aceitou/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Falta pagar a entrada/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Comprovantes para aprovar/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Abrir filtros avançados/ }),
    ).not.toBeInTheDocument()
    expect(carregarPaginaContratos).toHaveBeenCalledWith({
      pagina: 0,
      tamanho: 12,
    })
  })

  it('envia a fila selecionada para a API', async () => {
    useAuthStore.setState({ usuario: montarUsuario('gestor') })

    renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: /Comprovantes para aprovar/ }),
    )

    await waitFor(() => {
      expect(carregarPaginaContratos).toHaveBeenLastCalledWith({
        situacao: 'comprovante_em_analise',
        pagina: 0,
        tamanho: 12,
      })
    })
  })
})
