import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FinanceSummaryCards } from '@/features/finance/components/FinanceSummaryCards'
import type { ResumoFinanceiroMensal } from '@/features/finance/api/financeiroApi'

const resumo: ResumoFinanceiroMensal = {
  mes: '2026-11',
  quantidade: 2,
  quantidadeRecebidas: 1,
  quantidadePendentes: 1,
  totalPrevisto: 3000,
  totalRecebido: 1500,
  totalAReceber: 1500,
  totalEntradasRecebidas: 900,
  totalEntradasPendentes: 300,
  totalSaldos: 1200,
  totalSaldosRecebidos: 600,
  totalExtras: 300,
  totalExtrasRecebidos: 0,
  totalExtrasPendentes: 300,
  quantidadeSaldosPendentes: 1,
  quantidadeExtrasPendentes: 1,
  ticketMedio: 1500,
  percentualRecebido: 50,
  entradas: [],
}

describe('FinanceSummaryCards', () => {
  it('renderiza os indicadores principais', () => {
    render(<FinanceSummaryCards summary={resumo} />)

    expect(screen.getByText('Previsto no mês')).toBeInTheDocument()
    expect(screen.getByText('Já recebido')).toBeInTheDocument()
    expect(screen.getByText('A receber')).toBeInTheDocument()
    expect(screen.getByText('Ticket médio')).toBeInTheDocument()
    expect(screen.getByText('50% do previsto')).toBeInTheDocument()
    expect(screen.getByText('2 ensaios no mês')).toBeInTheDocument()
  })
})
