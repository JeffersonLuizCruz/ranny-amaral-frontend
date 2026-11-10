import type { FaixaFotoExtra, PacoteDraft, PacoteFotografico, PromocaoPacote } from '@/domain/types'
import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'
import type { Pagina } from '@/shared/api/types'

interface PromocaoDto {
  ativa: boolean
  valorPromocional: number
  validaAte: string | null
  rotulo: string | null
}

interface PacoteDto {
  id: string
  nome: string
  duracaoMinutos: number
  valor: number
  descricao: string
  corHex: string
  itensInclusos: string[]
  ativo: boolean
  quantidadeFotosInclusas: number
  quantidadeVideosInclusos: number
  valorFotoExtra: number
  faixasFotoExtra: FaixaFotoExtraDto[] | null
  promocao: PromocaoDto | null
  createdAt: string
  updatedAt: string
}

interface FaixaFotoExtraDto {
  quantidadeMinima: number
  valorUnitario: number
}

interface PacoteRequest {
  nome: string
  duracaoMinutos: number
  valor: number
  descricao: string
  corHex: string
  itensInclusos: string[]
  ativo: boolean
  quantidadeFotosInclusas: number
  quantidadeVideosInclusos: number
  valorFotoExtra: number
  faixasFotoExtra: FaixaFotoExtraDto[]
  promocao: PromocaoDto | null
}

function toPromocao(dto: PromocaoDto | null): PromocaoPacote | undefined {
  if (!dto) return undefined
  return {
    ativa: dto.ativa,
    valorPromocional: dto.valorPromocional,
    validaAte: dto.validaAte ?? undefined,
    rotulo: dto.rotulo ?? undefined,
  }
}

function toFaixas(dto: FaixaFotoExtraDto[] | null): FaixaFotoExtra[] {
  if (!dto) return []
  return dto.map((faixa) => ({
    quantidadeMinima: faixa.quantidadeMinima,
    valorUnitario: faixa.valorUnitario,
  }))
}

function toPacote(dto: PacoteDto): PacoteFotografico {
  return {
    id: dto.id,
    nome: dto.nome,
    duracaoMinutos: dto.duracaoMinutos,
    valor: dto.valor,
    descricao: dto.descricao,
    corHex: dto.corHex,
    itensInclusos: dto.itensInclusos,
    ativo: dto.ativo,
    quantidadeFotosInclusas: dto.quantidadeFotosInclusas,
    quantidadeVideosInclusos: dto.quantidadeVideosInclusos,
    valorFotoExtra: dto.valorFotoExtra,
    faixasFotoExtra: toFaixas(dto.faixasFotoExtra),
    promocao: toPromocao(dto.promocao),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toRequest(draft: PacoteDraft): PacoteRequest {
  return {
    nome: draft.nome,
    duracaoMinutos: draft.duracaoMinutos,
    valor: draft.valor,
    descricao: draft.descricao,
    corHex: draft.corHex,
    itensInclusos: draft.itensInclusos,
    ativo: draft.ativo,
    quantidadeFotosInclusas: draft.quantidadeFotosInclusas,
    quantidadeVideosInclusos: draft.quantidadeVideosInclusos,
    valorFotoExtra: draft.valorFotoExtra,
    faixasFotoExtra: (draft.faixasFotoExtra ?? []).map((faixa) => ({
      quantidadeMinima: faixa.quantidadeMinima,
      valorUnitario: faixa.valorUnitario,
    })),
    promocao: draft.promocao
      ? {
          ativa: draft.promocao.ativa,
          valorPromocional: draft.promocao.valorPromocional,
          validaAte: draft.promocao.validaAte ?? null,
          rotulo: draft.promocao.rotulo ?? null,
        }
      : null,
  }
}

export interface PacotesFiltros {
  q?: string
  ativo?: boolean
  pagina?: number
  tamanho?: number
  signal?: AbortSignal
}

export async function listarPacotesPagina(
  filtros: PacotesFiltros = {},
): Promise<Pagina<PacoteFotografico>> {
  const query = toQuery({
    q: filtros.q,
    ativo: filtros.ativo,
    pagina: filtros.pagina,
    tamanho: filtros.tamanho,
  })
  const dto = await http.get<Pagina<PacoteDto>>(`/pacotes${query}`, {
    signal: filtros.signal,
  })
  return { ...dto, itens: dto.itens.map(toPacote) }
}

/** Carrega todas as páginas para os consumidores que ainda precisam do catálogo completo. */
export async function listarPacotes(): Promise<PacoteFotografico[]> {
  const itens: PacoteFotografico[] = []
  let pagina = 0
  let totalPaginas = 1

  while (pagina < totalPaginas) {
    const resposta = await listarPacotesPagina({ pagina, tamanho: 100 })
    itens.push(...resposta.itens)
    totalPaginas = resposta.totalPaginas
    pagina += 1
  }

  return itens
}

export async function buscarPacote(id: string): Promise<PacoteFotografico> {
  const dto = await http.get<PacoteDto>(`/pacotes/${id}`)
  return toPacote(dto)
}

export async function criarPacote(draft: PacoteDraft): Promise<PacoteFotografico> {
  const dto = await http.post<PacoteDto>('/pacotes', toRequest(draft))
  return toPacote(dto)
}

export async function atualizarPacote(
  id: string,
  draft: PacoteDraft,
): Promise<PacoteFotografico> {
  const dto = await http.put<PacoteDto>(`/pacotes/${id}`, toRequest(draft))
  return toPacote(dto)
}

export async function alternarPacoteAtivo(id: string): Promise<PacoteFotografico> {
  const dto = await http.patch<PacoteDto>(`/pacotes/${id}/ativo`)
  return toPacote(dto)
}

export async function excluirPacote(id: string): Promise<void> {
  await http.delete(`/pacotes/${id}`)
}
