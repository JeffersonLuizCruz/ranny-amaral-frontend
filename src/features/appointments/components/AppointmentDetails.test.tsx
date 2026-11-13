import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AgendamentoEnsaio, Cliente, PacoteFotografico } from '@/domain/types'

const { addToast, createGallery, clientesById, pacotesById } = vi.hoisted(() => ({
  addToast: vi.fn(),
  createGallery: vi.fn().mockResolvedValue(undefined),
  clientesById: new Map<string, Cliente>(),
  pacotesById: new Map<string, PacoteFotografico>(),
}))

vi.mock('@/features/appointments/lib/lookups', () => ({
  useCrmLookups: () => ({ clientesById, pacotesById }),
}))

vi.mock('@/features/contracts/store/contractStore', () => ({
  useContractStore: (selector: (state: { contratos: never[] }) => unknown) =>
    selector({ contratos: [] }),
}))

vi.mock('@/features/galleries/store/galleryStore', () => ({
  useGalleryStore: (
    selector: (state: {
      galerias: never[]
      createGallery: typeof createGallery
    }) => unknown,
  ) => selector({ galerias: [], createGallery }),
}))

vi.mock('@/shared/store/toastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToast }) => unknown) =>
    selector({ addToast }),
}))

vi.mock('@/features/contracts/components/FinalPaymentPanel', () => ({
  FinalPaymentPanel: () => null,
}))

import { AppointmentDetails } from '@/features/appointments/components/AppointmentDetails'

function cliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'c1',
    nome: 'Mariana Silva',
    whatsapp: '(11) 91234-5678',
    origem: 'instagram',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function agendamento(
  overrides: Partial<AgendamentoEnsaio> = {},
): AgendamentoEnsaio {
  return {
    id: 'a1',
    clienteId: 'c1',
    pacoteId: 'p1',
    dataHoraInicio: '2026-11-20T13:00:00.000Z',
    dataHoraFim: '2026-11-20T14:30:00.000Z',
    local: 'Estúdio',
    status: 'confirmado',
    valorAcordado: 1000,
    valorEntrada: 300,
    percentualEntrada: 30,
    saldoRestante: 700,
    pagamentoEntrada: { valor: 300, percentual: 30, status: 'confirmado' },
    statusEntrada: 'confirmado',
    statusSaldoFinal: 'pendente',
    entradaQuitada: true,
    saldoQuitado: false,
    quitado: false,
    valorRecebido: 300,
    valorPendente: 700,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderDetalhes(appointment: AgendamentoEnsaio) {
  return render(
    <MemoryRouter>
      <AppointmentDetails
        appointment={appointment}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onClose={vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('AppointmentDetails', () => {
  beforeEach(() => {
    clientesById.clear()
    pacotesById.clear()
  })

  it('exibe o link de WhatsApp do cliente com mensagem pronta', () => {
    clientesById.set('c1', cliente())

    renderDetalhes(agendamento())

    const link = screen.getByRole('link', {
      name: 'Conversar no WhatsApp com Mariana Silva',
    })
    expect(link.getAttribute('href')).toContain('https://wa.me/5511912345678')
    expect(link.getAttribute('href')).toContain('Ol%C3%A1%2C%20Mariana%20Silva')
    expect(screen.getByText('Lembrete automático via WhatsApp')).toBeInTheDocument()
  })

  it('avisa quando o cliente não tem WhatsApp cadastrado', () => {
    clientesById.set('c1', cliente({ whatsapp: '' }))

    renderDetalhes(agendamento())

    expect(
      screen.getByText('Cliente sem WhatsApp cadastrado.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Conversar no WhatsApp/ }),
    ).not.toBeInTheDocument()
  })
})
