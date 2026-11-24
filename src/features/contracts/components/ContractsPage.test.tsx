import { render, screen } from '@testing-library/react'
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

  it('admin vê a busca e os filtros de aceite, entrada e saldo final', () => {
    renderPage()

    expect(screen.getByLabelText('Buscar contrato')).toBeInTheDocument()
    expect(screen.getByText('Aceite')).toBeInTheDocument()
    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Saldo final')).toBeInTheDocument()
  })

  it('gestor vê a lista sem busca nem filtros e envia apenas a paginação', () => {
    useAuthStore.setState({ usuario: montarUsuario('gestor') })

    renderPage()

    expect(screen.queryByLabelText('Buscar contrato')).not.toBeInTheDocument()
    expect(screen.queryByText('Aceite')).not.toBeInTheDocument()
    expect(screen.queryByText('Entrada')).not.toBeInTheDocument()
    expect(screen.queryByText('Saldo final')).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /Novo ensaio/ }).length,
    ).toBeGreaterThan(0)
    expect(carregarPaginaContratos).toHaveBeenCalledWith({ pagina: 0, tamanho: 12 })
  })
})
