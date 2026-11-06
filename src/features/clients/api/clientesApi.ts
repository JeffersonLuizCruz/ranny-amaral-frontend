import type { Cliente, ClienteDraft, ClienteOrigem } from '@/domain/types'
import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'
import type { Pagina } from '@/shared/api/types'

interface ClienteDto {
  id: string
  nome: string
  whatsapp: string | null
  email: string | null
  documento: string | null
  tipoDocumento: 'rg' | 'cpf' | null
  cidade: string | null
  origem: ClienteOrigem
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

interface ClienteRequest {
  nome: string
  whatsapp: string | null
  email: string | null
  documento: string | null
  tipoDocumento: 'rg' | 'cpf' | null
  cidade: string | null
  origem: ClienteOrigem
  observacoes: string | null
}

function toCliente(dto: ClienteDto): Cliente {
  return {
    id: dto.id,
    nome: dto.nome,
    whatsapp: dto.whatsapp ?? '',
    email: dto.email ?? undefined,
    documento: dto.documento ?? undefined,
    tipoDocumento: dto.tipoDocumento ?? undefined,
    cidade: dto.cidade ?? undefined,
    origem: dto.origem,
    observacoes: dto.observacoes ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toRequest(draft: ClienteDraft): ClienteRequest {
  return {
    nome: draft.nome,
    whatsapp: draft.whatsapp || null,
    email: draft.email ?? null,
    documento: draft.documento ?? null,
    tipoDocumento: draft.tipoDocumento ?? null,
    cidade: draft.cidade ?? null,
    origem: draft.origem,
    observacoes: draft.observacoes ?? null,
  }
}

export interface ClientesFiltros {
  q?: string
  pagina?: number
  tamanho?: number
  signal?: AbortSignal
}

export async function listarClientesPagina(
  filtros: ClientesFiltros = {},
): Promise<Pagina<Cliente>> {
  const query = toQuery({
    q: filtros.q,
    pagina: filtros.pagina,
    tamanho: filtros.tamanho,
  })
  const dto = await http.get<Pagina<ClienteDto>>(`/clientes${query}`, {
    signal: filtros.signal,
  })
  return { ...dto, itens: dto.itens.map(toCliente) }
}

/**
 * Carrega todas as páginas.
 *
 * Transitório: mantém pickers e módulos ainda locais (galerias/financeiro)
 * funcionando enquanto as telas de listagem já usam paginação real.
 */
export async function listarClientes(): Promise<Cliente[]> {
  const itens: Cliente[] = []
  let pagina = 0
  let totalPaginas = 1

  while (pagina < totalPaginas) {
    const resposta = await listarClientesPagina({ pagina, tamanho: 100 })
    itens.push(...resposta.itens)
    totalPaginas = resposta.totalPaginas
    pagina += 1
  }

  return itens
}

export async function buscarCliente(id: string): Promise<Cliente> {
  const dto = await http.get<ClienteDto>(`/clientes/${id}`)
  return toCliente(dto)
}

export async function criarCliente(draft: ClienteDraft): Promise<Cliente> {
  const dto = await http.post<ClienteDto>('/clientes', toRequest(draft))
  return toCliente(dto)
}

export async function atualizarCliente(id: string, draft: ClienteDraft): Promise<Cliente> {
  const dto = await http.put<ClienteDto>(`/clientes/${id}`, toRequest(draft))
  return toCliente(dto)
}

export async function excluirCliente(id: string): Promise<void> {
  await http.delete(`/clientes/${id}`)
}
