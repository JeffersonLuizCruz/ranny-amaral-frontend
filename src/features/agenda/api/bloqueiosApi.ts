import type { BloqueioAgenda, BloqueioAgendaDraft } from '@/domain/types'
import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'

interface BloqueioAgendaDto {
  id: string
  inicio: string
  fim: string
  diaInteiro: boolean
  data: string
  horaInicio: string
  horaFim: string
  motivo: string
  createdAt: string
  updatedAt: string
}

function paraBloqueio(dto: BloqueioAgendaDto): BloqueioAgenda {
  return {
    id: dto.id,
    inicio: dto.inicio,
    fim: dto.fim,
    diaInteiro: dto.diaInteiro,
    data: dto.data,
    horaInicio: dto.horaInicio,
    horaFim: dto.horaFim,
    motivo: dto.motivo,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function paraRequest(draft: BloqueioAgendaDraft) {
  return {
    data: draft.data,
    diaInteiro: draft.diaInteiro,
    horaInicio: draft.diaInteiro ? null : draft.horaInicio,
    horaFim: draft.diaInteiro ? null : draft.horaFim,
    motivo: draft.motivo,
  }
}

export async function listarBloqueios(
  inicio: string,
  fim: string,
): Promise<BloqueioAgenda[]> {
  const dtos = await http.get<BloqueioAgendaDto[]>(
    `/agenda/bloqueios${toQuery({ inicio, fim })}`,
  )
  return dtos.map(paraBloqueio)
}

export async function criarBloqueio(
  draft: BloqueioAgendaDraft,
): Promise<BloqueioAgenda> {
  const dto = await http.post<BloqueioAgendaDto>('/agenda/bloqueios', paraRequest(draft))
  return paraBloqueio(dto)
}

export async function atualizarBloqueio(
  id: string,
  draft: BloqueioAgendaDraft,
): Promise<BloqueioAgenda> {
  const dto = await http.put<BloqueioAgendaDto>(
    `/agenda/bloqueios/${id}`,
    paraRequest(draft),
  )
  return paraBloqueio(dto)
}

export async function excluirBloqueio(id: string): Promise<void> {
  await http.delete(`/agenda/bloqueios/${id}`)
}
