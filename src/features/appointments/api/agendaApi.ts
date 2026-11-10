import type {
  ComprovantePagamento,
  ComprovanteRejeicao,
  FormaPagamentoSaldo,
  PagamentoEntrada,
  PagamentoSaldo,
  PagamentoStatus,
} from '@/domain/payments'
import type {
  AgendamentoDraft,
  AgendamentoEnsaio,
  AgendamentoStatus,
  CondicoesPacote,
} from '@/domain/types'
import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'
import type { Pagina } from '@/shared/api/types'

interface ContatoDto {
  nome: string | null
  whatsapp: string | null
}

interface PromocaoAplicadaDto {
  valorPromocional: number
  rotulo: string | null
}

interface CondicoesPacoteDto {
  quantidadeFotosInclusas: number
  quantidadeVideosInclusos: number
  valorFotoExtra: number
  valorTabela: number
  faixasFotoExtra: { quantidadeMinima: number; valorUnitario: number }[] | null
  promocaoAplicada: PromocaoAplicadaDto | null
}

interface PagamentoEntradaDto {
  valor: number | null
  percentual: number | null
  status: PagamentoStatus | null
  arquivoId: string | null
  comprovante: ComprovantePagamento | null
  rejeicao: ComprovanteRejeicao | null
  confirmadoEm: string | null
  confirmadoPor: string | null
  observacoes: string | null
}

interface PagamentoSaldoDto {
  valor: number | null
  status: PagamentoStatus | null
  formaPagamento: FormaPagamentoSaldo | null
  recebidoEm: string | null
  recebidoPor: string | null
  observacoes: string | null
}

interface AgendamentoDto {
  id: string
  clienteId: string | null
  contato: ContatoDto | null
  contratoId: string | null
  pacoteId: string
  dataHoraInicio: string
  dataHoraFim: string
  local: string
  status: AgendamentoStatus
  observacoes: string | null
  valorAcordado: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  pagamentoEntrada: PagamentoEntradaDto | null
  pagamentoFinal: PagamentoSaldoDto | null
  statusEntrada: PagamentoStatus
  statusSaldoFinal: PagamentoStatus
  entradaQuitada: boolean
  saldoQuitado: boolean
  quitado: boolean
  valorRecebido: number
  valorPendente: number
  condicoesPacote: CondicoesPacoteDto | null
  galeriaId: string | null
  createdAt: string
  updatedAt: string
}

interface AgendamentoRequest {
  clienteId: string | null
  contato: { nome: string | null; whatsapp: string | null } | null
  pacoteId: string
  dataHoraInicio: string
  dataHoraFim: string
  local: string
  status: AgendamentoStatus
  observacoes: string | null
  valorAcordado: number
  valorEntrada: number
  percentualEntrada: number
  aplicarPromocao: boolean
}

function toPagamentoEntrada(dto: PagamentoEntradaDto | null): PagamentoEntrada {
  return {
    valor: dto?.valor ?? 0,
    percentual: dto?.percentual ?? 0,
    status: dto?.status ?? 'pendente',
    arquivoId: dto?.arquivoId ?? undefined,
    comprovante: dto?.comprovante ?? undefined,
    rejeicao: dto?.rejeicao ?? undefined,
    confirmadoEm: dto?.confirmadoEm ?? undefined,
    confirmadoPor: dto?.confirmadoPor ?? undefined,
    observacoes: dto?.observacoes ?? undefined,
  }
}

function toPagamentoSaldo(dto: PagamentoSaldoDto | null): PagamentoSaldo | undefined {
  if (!dto) return undefined
  return {
    valor: dto.valor ?? 0,
    status: dto.status ?? 'pendente',
    formaPagamento: dto.formaPagamento ?? undefined,
    recebidoEm: dto.recebidoEm ?? undefined,
    recebidoPor: dto.recebidoPor ?? undefined,
    observacoes: dto.observacoes ?? undefined,
  }
}

function toCondicoes(dto: CondicoesPacoteDto | null): CondicoesPacote | undefined {
  if (!dto) return undefined
  return {
    quantidadeFotosInclusas: dto.quantidadeFotosInclusas,
    quantidadeVideosInclusos: dto.quantidadeVideosInclusos,
    valorFotoExtra: dto.valorFotoExtra,
    valorTabela: dto.valorTabela,
    faixasFotoExtra: dto.faixasFotoExtra ?? [],
    promocaoAplicada: dto.promocaoAplicada
      ? {
          valorPromocional: dto.promocaoAplicada.valorPromocional,
          rotulo: dto.promocaoAplicada.rotulo ?? undefined,
        }
      : undefined,
  }
}

function toAgendamento(dto: AgendamentoDto): AgendamentoEnsaio {
  return {
    id: dto.id,
    clienteId: dto.clienteId ?? undefined,
    contato: dto.contato
      ? {
          nome: dto.contato.nome ?? undefined,
          whatsapp: dto.contato.whatsapp ?? undefined,
        }
      : undefined,
    contratoId: dto.contratoId ?? undefined,
    pacoteId: dto.pacoteId,
    dataHoraInicio: dto.dataHoraInicio,
    dataHoraFim: dto.dataHoraFim,
    local: dto.local,
    status: dto.status,
    observacoes: dto.observacoes ?? undefined,
    valorAcordado: dto.valorAcordado,
    valorEntrada: dto.valorEntrada,
    percentualEntrada: dto.percentualEntrada,
    saldoRestante: dto.saldoRestante,
    pagamentoEntrada: toPagamentoEntrada(dto.pagamentoEntrada),
    pagamentoFinal: toPagamentoSaldo(dto.pagamentoFinal),
    statusEntrada: dto.statusEntrada,
    statusSaldoFinal: dto.statusSaldoFinal,
    entradaQuitada: dto.entradaQuitada,
    saldoQuitado: dto.saldoQuitado,
    quitado: dto.quitado,
    valorRecebido: dto.valorRecebido,
    valorPendente: dto.valorPendente,
    condicoesPacote: toCondicoes(dto.condicoesPacote),
    galeriaId: dto.galeriaId ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toRequest(draft: AgendamentoDraft): AgendamentoRequest {
  return {
    clienteId: draft.clienteId ?? null,
    contato: draft.contato
      ? {
          nome: draft.contato.nome ?? null,
          whatsapp: draft.contato.whatsapp ?? null,
        }
      : null,
    pacoteId: draft.pacoteId,
    dataHoraInicio: draft.dataHoraInicio,
    dataHoraFim: draft.dataHoraFim,
    local: draft.local,
    status: draft.status,
    observacoes: draft.observacoes ?? null,
    valorAcordado: draft.valorAcordado,
    valorEntrada: draft.valorEntrada,
    percentualEntrada: draft.percentualEntrada,
    aplicarPromocao: Boolean(draft.condicoesPacote?.promocaoAplicada),
  }
}

/** Persiste o estado da entrada após criar/editar (ex.: "entrada paga" marcada). */
async function sincronizarEntrada(
  id: string,
  pagamento: PagamentoEntrada | undefined,
): Promise<AgendamentoDto> {
  return http.put<AgendamentoDto>(`/agenda/${id}/pagamento-entrada`, {
    valor: pagamento?.valor ?? 0,
    percentual: pagamento?.percentual ?? 0,
    status: pagamento?.status ?? 'pendente',
    observacoes: pagamento?.observacoes ?? null,
  })
}

export interface AgendamentosFiltros {
  inicio?: string
  fim?: string
  status?: AgendamentoStatus
  pagina?: number
  tamanho?: number
  signal?: AbortSignal
}

export async function listarAgendamentosPagina(
  filtros: AgendamentosFiltros = {},
): Promise<Pagina<AgendamentoEnsaio>> {
  const query = toQuery({
    inicio: filtros.inicio,
    fim: filtros.fim,
    status: filtros.status,
    pagina: filtros.pagina,
    tamanho: filtros.tamanho,
  })
  const dto = await http.get<Pagina<AgendamentoDto>>(`/agenda${query}`, {
    signal: filtros.signal,
  })
  return { ...dto, itens: dto.itens.map(toAgendamento) }
}

/** Carrega todas as páginas (transitório para os módulos ainda locais). */
export async function listarAgendamentos(): Promise<AgendamentoEnsaio[]> {
  const itens: AgendamentoEnsaio[] = []
  let pagina = 0
  let totalPaginas = 1

  while (pagina < totalPaginas) {
    const resposta = await listarAgendamentosPagina({ pagina, tamanho: 100 })
    itens.push(...resposta.itens)
    totalPaginas = resposta.totalPaginas
    pagina += 1
  }

  return itens
}

export async function listarAgendaCalendario(
  inicio: string,
  fim: string,
  status?: AgendamentoStatus,
): Promise<AgendamentoEnsaio[]> {
  const query = toQuery({ inicio, fim, status })
  const dtos = await http.get<AgendamentoDto[]>(`/agenda/calendario${query}`)
  return dtos.map(toAgendamento)
}

export async function criarAgendamento(draft: AgendamentoDraft): Promise<AgendamentoEnsaio> {
  const criado = await http.post<AgendamentoDto>('/agenda', toRequest(draft))
  const atualizado = await sincronizarEntrada(criado.id, draft.pagamentoEntrada)
  return toAgendamento(atualizado)
}

export async function atualizarAgendamento(
  id: string,
  draft: AgendamentoDraft,
): Promise<AgendamentoEnsaio> {
  await http.put<AgendamentoDto>(`/agenda/${id}`, toRequest(draft))
  const comPagamento = await sincronizarEntrada(id, draft.pagamentoEntrada)
  return toAgendamento(comPagamento)
}

export async function excluirAgendamento(id: string): Promise<void> {
  await http.delete(`/agenda/${id}`)
}

export async function alterarStatusAgendamento(
  id: string,
  status: AgendamentoStatus,
): Promise<AgendamentoEnsaio> {
  const dto = await http.patch<AgendamentoDto>(`/agenda/${id}/status`, { status })
  return toAgendamento(dto)
}

export async function atualizarPagamentoEntrada(
  id: string,
  pagamento: PagamentoEntrada,
): Promise<AgendamentoEnsaio> {
  const dto = await http.put<AgendamentoDto>(`/agenda/${id}/pagamento-entrada`, {
    valor: pagamento.valor,
    percentual: pagamento.percentual,
    status: pagamento.status,
    observacoes: pagamento.observacoes ?? null,
  })
  return toAgendamento(dto)
}

export async function atualizarPagamentoFinal(
  id: string,
  pagamento: PagamentoSaldo,
): Promise<AgendamentoEnsaio> {
  const dto = await http.put<AgendamentoDto>(`/agenda/${id}/pagamento-final`, {
    valor: pagamento.valor,
    status: pagamento.status,
    formaPagamento: pagamento.formaPagamento ?? null,
    recebidoEm: pagamento.recebidoEm ?? null,
    recebidoPor: pagamento.recebidoPor ?? null,
    observacoes: pagamento.observacoes ?? null,
  })
  return toAgendamento(dto)
}
