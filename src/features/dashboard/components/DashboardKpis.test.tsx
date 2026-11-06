import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis'

const resumo = {
  ensaiosHoje: 2,
  ensaiosSemana: 5,
  contratosAguardandoAceite: 3,
  contratosEntradaPendente: 1,
  galeriasEmSelecao: 2,
  galeriasAguardandoEdicao: 1,
  galeriasEmEdicao: 2,
  galeriasProntasEntrega: 1,
  extrasPendentes: 4,
}

const financeiro = {
  mes: '2026-11',
  totalPrevisto: 10000,
  totalRecebido: 6000,
  totalAReceber: 4000,
  quantidadePendentes: 3,
  quantidadeExtrasPendentes: 2,
}

describe('DashboardKpis', () => {
  it('renderiza os indicadores operacionais', () => {
    render(<DashboardKpis resumo={resumo} financeiro={financeiro} />)

    expect(screen.getByText('Ensaios hoje')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5 nos próximos 7 dias')).toBeInTheDocument()
    expect(screen.getByText('Contratos pendentes')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Galerias em produção')).toBeInTheDocument()
    expect(screen.getByText('A receber no mês')).toBeInTheDocument()
    expect(screen.getByText(/4\.000,00/)).toBeInTheDocument()
  })
})
