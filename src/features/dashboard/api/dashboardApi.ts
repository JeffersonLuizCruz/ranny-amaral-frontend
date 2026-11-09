import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'

export interface DashboardResumo {
  ensaiosHoje: number
  ensaiosSemana: number
  contratosAguardandoAceite: number
  contratosEntradaPendente: number
  contratosSaldoPendente: number
  galeriasEmSelecao: number
  galeriasAguardandoEdicao: number
  galeriasEmEdicao: number
  galeriasProntasEntrega: number
  extrasPendentes: number
}

export interface ProximoEnsaio {
  id: string
  clienteId: string | null
  clienteNome: string | null
  pacoteId: string | null
  inicio: string
  fim: string | null
  status: string
}

export interface Pendencia {
  tipo: string
  titulo: string
  descricao: string
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
  link: string
}

export interface FinanceiroResumo {
  mes: string
  totalPrevisto: number
  totalRecebido: number
  totalAReceber: number
  quantidadePendentes: number
  quantidadeExtrasPendentes: number
}

export interface DashboardData {
  data: string
  resumo: DashboardResumo
  proximosEnsaios: ProximoEnsaio[]
  pendencias: Pendencia[]
  financeiroMes: FinanceiroResumo
}

export async function buscarDashboard(data?: string): Promise<DashboardData> {
  return http.get<DashboardData>(`/dashboard${toQuery({ data })}`)
}
