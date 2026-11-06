import type { EstudioConfig } from '@/domain/contracts'
import { http } from '@/shared/api/httpClient'

interface EstudioDto {
  nome: string
  razaoSocial: string | null
  cnpj: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  email: string | null
  telefone: string | null
  responsavel: string | null
  site: string | null
  foro: string | null
  percentualEntradaPadrao: number
  chavePix: string | null
  instrucoesPagamento: string | null
  prazoPagamentoDias: number | null
}

function toEstudio(dto: EstudioDto): EstudioConfig {
  return {
    nome: dto.nome,
    razaoSocial: dto.razaoSocial ?? undefined,
    cnpj: dto.cnpj ?? undefined,
    endereco: dto.endereco ?? undefined,
    cidade: dto.cidade ?? undefined,
    estado: dto.estado ?? undefined,
    email: dto.email ?? undefined,
    telefone: dto.telefone ?? undefined,
    responsavel: dto.responsavel ?? undefined,
    site: dto.site ?? undefined,
    foro: dto.foro ?? undefined,
    percentualEntradaPadrao: dto.percentualEntradaPadrao,
    chavePix: dto.chavePix ?? undefined,
    instrucoesPagamento: dto.instrucoesPagamento ?? undefined,
    prazoPagamentoDias: dto.prazoPagamentoDias ?? undefined,
  }
}

export async function obterEstudio(): Promise<EstudioConfig> {
  return toEstudio(await http.get<EstudioDto>('/estudio'))
}

export async function atualizarEstudio(config: EstudioConfig): Promise<EstudioConfig> {
  const dto = await http.put<EstudioDto>('/estudio', {
    nome: config.nome,
    razaoSocial: config.razaoSocial ?? null,
    cnpj: config.cnpj ?? null,
    endereco: config.endereco ?? null,
    cidade: config.cidade ?? null,
    estado: config.estado ?? null,
    email: config.email ?? null,
    telefone: config.telefone ?? null,
    responsavel: config.responsavel ?? null,
    site: config.site ?? null,
    foro: config.foro ?? null,
    percentualEntradaPadrao: config.percentualEntradaPadrao,
    chavePix: config.chavePix ?? null,
    instrucoesPagamento: config.instrucoesPagamento ?? null,
    prazoPagamentoDias: config.prazoPagamentoDias ?? null,
  })
  return toEstudio(dto)
}
