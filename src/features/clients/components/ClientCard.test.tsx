import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Contrato } from '@/domain/contracts'
import type { AgendamentoEnsaio, Cliente, PacoteFotografico } from '@/domain/types'
import { ClientCard } from '@/features/clients/components/ClientCard'
import { montarResumoCliente } from '@/features/clients/lib/profile'

const cliente = {
  id: 'c1',
  nome: 'Mariana Silva',
  whatsapp: '(11) 91234-5678',
  email: 'mariana@teste.com',
  origem: 'instagram',
  createdAt: '2024-03-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
} as Cliente

const pacote = {
  id: 'p1',
  nome: 'Ensaio Gestante',
  corHex: '#7C3AED',
} as PacoteFotografico

const appointment = {
  id: 'a1',
  clienteId: 'c1',
  pacoteId: 'p1',
  dataHoraInicio: '2026-11-20T13:00:00.000Z',
  dataHoraFim: '2026-11-20T14:30:00.000Z',
  local: 'Estúdio',
  status: 'confirmado',
  valorAcordado: 1000,
  valorRecebido: 300,
  valorPendente: 700,
  updatedAt: '2026-10-01T12:00:00.000Z',
} as AgendamentoEnsaio

const contrato = {
  id: 'ct1',
  numero: 'CT-2026-0001',
  clienteId: 'c1',
  agendamentoId: 'a1',
  statusAceite: 'aceito',
  valorTotal: 1000,
  valorRecebido: 300,
  valorPendente: 700,
  dataEmissao: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
} as Contrato

function renderCard() {
  const resumo = montarResumoCliente({
    cliente,
    appointments: [appointment],
    contratos: [contrato],
    galerias: [],
    agora: new Date('2026-11-13T12:00:00.000Z'),
  })
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onCreateAppointment = vi.fn()

  render(
    <MemoryRouter>
      <ClientCard
        cliente={cliente}
        resumo={resumo}
        pacotesById={new Map([['p1', pacote]])}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateAppointment={onCreateAppointment}
      />
    </MemoryRouter>,
  )

  return { onEdit, onDelete, onCreateAppointment }
}

describe('ClientCard', () => {
  it('mostra o resumo financeiro e abre a ficha pelo card', () => {
    renderCard()

    expect(screen.getByText('Mariana Silva')).toBeInTheDocument()
    expect(screen.getByText('Pendência')).toBeInTheDocument()
    expect(screen.getByText(/Ensaio Gestante/)).toBeInTheDocument()
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 300,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 700,00')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Abrir ficha de Mariana Silva' }),
    ).toHaveAttribute('href', '/clientes/c1')
  })

  it('mantém as ações rápidas no card', () => {
    const { onCreateAppointment, onEdit, onDelete } = renderCard()

    expect(
      screen.getByRole('link', { name: 'Abrir WhatsApp de Mariana Silva' }),
    ).toHaveAttribute('href', expect.stringContaining('https://wa.me/5511912345678'))

    fireEvent.click(screen.getByRole('button', { name: /Novo ensaio/ }))
    fireEvent.click(screen.getByLabelText('Editar Mariana Silva'))
    fireEvent.click(screen.getByLabelText('Excluir Mariana Silva'))

    expect(onCreateAppointment).toHaveBeenCalledWith(cliente)
    expect(onEdit).toHaveBeenCalledWith(cliente)
    expect(onDelete).toHaveBeenCalledWith(cliente)
  })
})
