import type {
  ContratoClausula,
  ModeloContrato,
  ModeloContratoDraft,
} from '@/domain/contracts'
import { http } from '@/shared/api/httpClient'

interface ModeloContratoDto {
  id: string
  nome: string
  descricao: string | null
  clausulas: ContratoClausula[]
  ativo: boolean
  versao: number
  createdAt: string
  updatedAt: string
}

interface ModeloContratoRequest {
  nome: string
  descricao: string | null
  clausulas: ContratoClausula[]
  ativo: boolean
}

function toModelo(dto: ModeloContratoDto): ModeloContrato {
  return {
    id: dto.id,
    nome: dto.nome,
    descricao: dto.descricao ?? '',
    clausulas: dto.clausulas,
    ativo: dto.ativo,
    versao: dto.versao,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toRequest(draft: ModeloContratoDraft): ModeloContratoRequest {
  return {
    nome: draft.nome,
    descricao: draft.descricao || null,
    clausulas: draft.clausulas,
    ativo: draft.ativo,
  }
}

export async function listarModelos(): Promise<ModeloContrato[]> {
  const dtos = await http.get<ModeloContratoDto[]>('/modelos-contrato')
  return dtos.map(toModelo)
}

export async function criarModelo(draft: ModeloContratoDraft): Promise<ModeloContrato> {
  return toModelo(await http.post<ModeloContratoDto>('/modelos-contrato', toRequest(draft)))
}

export async function atualizarModelo(
  id: string,
  draft: ModeloContratoDraft,
): Promise<ModeloContrato> {
  return toModelo(
    await http.put<ModeloContratoDto>(`/modelos-contrato/${id}`, toRequest(draft)),
  )
}

export async function duplicarModelo(id: string): Promise<ModeloContrato> {
  return toModelo(await http.post<ModeloContratoDto>(`/modelos-contrato/${id}/duplicar`))
}

export async function alternarModeloAtivo(id: string): Promise<ModeloContrato> {
  return toModelo(await http.patch<ModeloContratoDto>(`/modelos-contrato/${id}/ativo`))
}

export async function excluirModelo(id: string): Promise<void> {
  await http.delete(`/modelos-contrato/${id}`)
}
