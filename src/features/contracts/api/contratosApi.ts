import type {
  Contrato,
  ContratoAceiteStatus,
  ContratoClausula,
  ContratoDraft,
  ContratoEvento,
  ContratoPagamentoStatus,
  ContratoSnapshot,
  DadosAceite,
  SolicitacaoAceite,
  SolicitacaoAceiteStatus,
} from '@/domain/contracts'
import type {
  ComprovantePagamento,
  ComprovanteRejeicao,
  FormaPagamentoSaldo,
  PagamentoEntrada,
  PagamentoSaldo,
  PagamentoStatus,
} from '@/domain/payments'
import { http } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'
import type { Pagina } from '@/shared/api/types'

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

interface SnapshotClienteDto {
  nome: string
  whatsapp: string | null
  email: string | null
  documento: string | null
  tipoDocumento: 'rg' | 'cpf' | null
  cidade: string | null
}

interface SnapshotPromocaoDto {
  valorPromocional: number
  rotulo: string | null
}

interface SnapshotPacoteDto {
  nome: string
  duracaoMinutos: number
  valor: number
  itensInclusos: string[]
  quantidadeFotosInclusas: number
  quantidadeVideosInclusos: number
  valorFotoExtra: number
  promocaoAplicada: SnapshotPromocaoDto | null
  valorEfetivo: number | null
}

interface SnapshotAgendamentoDto {
  dataHoraInicio: string
  dataHoraFim: string
  local: string
  valorAcordado: number
}

interface SnapshotEstudioDto {
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

interface SnapshotDto {
  cliente: SnapshotClienteDto
  pacote: SnapshotPacoteDto | null
  agendamento: SnapshotAgendamentoDto | null
  estudio: SnapshotEstudioDto
  modeloVersao: number
}

interface ContratoDto {
  id: string
  numero: string
  clienteId: string | null
  agendamentoId: string | null
  pacoteId: string | null
  modeloId: string
  statusAceite: ContratoAceiteStatus
  statusEntrada: ContratoPagamentoStatus
  titulo: string
  clausulas: ContratoClausula[]
  clausulasModelo: ContratoClausula[]
  snapshot: SnapshotDto
  valorTotal: number
  valorEntrada: number
  percentualEntrada: number
  saldoRestante: number
  pagamento: PagamentoEntradaDto | null
  pagamentoFinal: PagamentoSaldoDto | null
  statusSaldoFinal: ContratoPagamentoStatus
  entradaQuitada: boolean
  saldoQuitado: boolean
  quitado: boolean
  valorRecebido: number
  valorPendente: number
  formaPagamento: string | null
  condicoesPagamento: string | null
  dataEmissao: string
  dataValidade: string | null
  solicitacaoAtualId: string | null
  aceite: DadosAceite | null
  historico: ContratoEvento[]
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

interface SolicitacaoAceiteDto {
  id: string
  contratoId: string
  token: string
  status: SolicitacaoAceiteStatus
  criadaEm: string
  expiraEm: string
  visualizadaEm: string | null
  protocolo: string | null
  dadosAceite: DadosAceite | null
}

interface ContratoRequestPayload {
  clienteId: string | null
  agendamentoId: string | null
  pacoteId: string | null
  modeloId: string
  titulo: string
  valorTotal: number
  valorEntrada: number
  percentualEntrada: number
  formaPagamento: string | null
  condicoesPagamento: string | null
  dataValidade: string | null
  observacoes: string | null
}

export function toPagamentoEntrada(dto: PagamentoEntradaDto | null): PagamentoEntrada {
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

function toPagamentoSaldo(dto: PagamentoSaldoDto | null): PagamentoSaldo {
  return {
    valor: dto?.valor ?? 0,
    status: dto?.status ?? 'pendente',
    formaPagamento: dto?.formaPagamento ?? undefined,
    recebidoEm: dto?.recebidoEm ?? undefined,
    recebidoPor: dto?.recebidoPor ?? undefined,
    observacoes: dto?.observacoes ?? undefined,
  }
}

function toSnapshot(dto: SnapshotDto): ContratoSnapshot {
  return {
    cliente: {
      nome: dto.cliente.nome,
      whatsapp: dto.cliente.whatsapp ?? undefined,
      email: dto.cliente.email ?? undefined,
      documento: dto.cliente.documento ?? undefined,
      tipoDocumento: dto.cliente.tipoDocumento ?? undefined,
      cidade: dto.cliente.cidade ?? undefined,
    },
    pacote: dto.pacote
      ? {
          nome: dto.pacote.nome,
          duracaoMinutos: dto.pacote.duracaoMinutos,
          valor: dto.pacote.valor,
          itensInclusos: dto.pacote.itensInclusos,
          quantidadeFotosInclusas: dto.pacote.quantidadeFotosInclusas,
          quantidadeVideosInclusos: dto.pacote.quantidadeVideosInclusos,
          valorFotoExtra: dto.pacote.valorFotoExtra,
          promocaoAplicada: dto.pacote.promocaoAplicada
            ? {
                valorPromocional: dto.pacote.promocaoAplicada.valorPromocional,
                rotulo: dto.pacote.promocaoAplicada.rotulo ?? undefined,
              }
            : undefined,
          valorEfetivo: dto.pacote.valorEfetivo ?? undefined,
        }
      : undefined,
    agendamento: dto.agendamento
      ? {
          dataHoraInicio: dto.agendamento.dataHoraInicio,
          dataHoraFim: dto.agendamento.dataHoraFim,
          local: dto.agendamento.local,
          valorAcordado: dto.agendamento.valorAcordado,
        }
      : undefined,
    estudio: {
      nome: dto.estudio.nome,
      razaoSocial: dto.estudio.razaoSocial ?? undefined,
      cnpj: dto.estudio.cnpj ?? undefined,
      endereco: dto.estudio.endereco ?? undefined,
      cidade: dto.estudio.cidade ?? undefined,
      estado: dto.estudio.estado ?? undefined,
      email: dto.estudio.email ?? undefined,
      telefone: dto.estudio.telefone ?? undefined,
      responsavel: dto.estudio.responsavel ?? undefined,
      site: dto.estudio.site ?? undefined,
      foro: dto.estudio.foro ?? undefined,
      percentualEntradaPadrao: dto.estudio.percentualEntradaPadrao,
      chavePix: dto.estudio.chavePix ?? undefined,
      instrucoesPagamento: dto.estudio.instrucoesPagamento ?? undefined,
      prazoPagamentoDias: dto.estudio.prazoPagamentoDias ?? undefined,
    },
    modeloVersao: dto.modeloVersao,
  }
}

export function toContrato(dto: ContratoDto): Contrato {
  return {
    id: dto.id,
    numero: dto.numero,
    clienteId: dto.clienteId ?? undefined,
    agendamentoId: dto.agendamentoId ?? undefined,
    pacoteId: dto.pacoteId ?? undefined,
    modeloId: dto.modeloId,
    statusAceite: dto.statusAceite,
    titulo: dto.titulo,
    clausulas: dto.clausulas,
    clausulasModelo: dto.clausulasModelo,
    snapshot: toSnapshot(dto.snapshot),
    valorTotal: dto.valorTotal,
    valorEntrada: dto.valorEntrada,
    percentualEntrada: dto.percentualEntrada,
    saldoRestante: dto.saldoRestante,
    pagamento: toPagamentoEntrada(dto.pagamento),
    pagamentoFinal: toPagamentoSaldo(dto.pagamentoFinal),
    statusEntrada: dto.statusEntrada,
    statusSaldoFinal: dto.statusSaldoFinal,
    entradaQuitada: dto.entradaQuitada,
    saldoQuitado: dto.saldoQuitado,
    quitado: dto.quitado,
    valorRecebido: dto.valorRecebido,
    valorPendente: dto.valorPendente,
    formaPagamento: dto.formaPagamento ?? '',
    condicoesPagamento: dto.condicoesPagamento ?? undefined,
    dataEmissao: dto.dataEmissao,
    dataValidade: dto.dataValidade ?? undefined,
    solicitacaoAtualId: dto.solicitacaoAtualId ?? undefined,
    aceite: dto.aceite ?? undefined,
    historico: dto.historico ?? [],
    observacoes: dto.observacoes ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export function toSolicitacao(dto: SolicitacaoAceiteDto): SolicitacaoAceite {
  return {
    id: dto.id,
    contratoId: dto.contratoId,
    token: dto.token,
    status: dto.status,
    criadaEm: dto.criadaEm,
    expiraEm: dto.expiraEm,
    visualizadaEm: dto.visualizadaEm ?? undefined,
    dadosAceite: dto.dadosAceite ?? undefined,
  }
}

function toRequest(draft: ContratoDraft): ContratoRequestPayload {
  return {
    clienteId: draft.clienteId ?? null,
    agendamentoId: draft.agendamentoId ?? null,
    pacoteId: draft.pacoteId ?? null,
    modeloId: draft.modeloId,
    titulo: draft.titulo,
    valorTotal: draft.valorTotal,
    valorEntrada: draft.valorEntrada,
    percentualEntrada: draft.percentualEntrada,
    formaPagamento: draft.formaPagamento || null,
    condicoesPagamento: draft.condicoesPagamento ?? null,
    dataValidade: draft.dataValidade ?? null,
    observacoes: draft.observacoes ?? null,
  }
}

export interface ContratosFiltros {
  q?: string
  statusAceite?: ContratoAceiteStatus
  statusEntrada?: ContratoPagamentoStatus
  statusSaldoFinal?: ContratoPagamentoStatus
  clienteId?: string
  agendamentoId?: string
  pagina?: number
  tamanho?: number
  signal?: AbortSignal
}

export async function listarContratosPagina(
  filtros: ContratosFiltros = {},
): Promise<Pagina<Contrato>> {
  const query = toQuery({
    q: filtros.q,
    statusAceite: filtros.statusAceite,
    statusEntrada: filtros.statusEntrada,
    statusSaldoFinal: filtros.statusSaldoFinal,
    clienteId: filtros.clienteId,
    agendamentoId: filtros.agendamentoId,
    pagina: filtros.pagina,
    tamanho: filtros.tamanho,
  })
  const dto = await http.get<Pagina<ContratoDto>>(`/contratos${query}`, {
    signal: filtros.signal,
  })
  return { ...dto, itens: dto.itens.map(toContrato) }
}

/** Carrega todas as páginas para os consumidores que ainda precisam da lista completa. */
export async function listarContratos(): Promise<Contrato[]> {
  const itens: Contrato[] = []
  let pagina = 0
  let totalPaginas = 1

  while (pagina < totalPaginas) {
    const resposta = await listarContratosPagina({ pagina, tamanho: 100 })
    itens.push(...resposta.itens)
    totalPaginas = resposta.totalPaginas
    pagina += 1
  }

  return itens
}

export async function buscarContrato(id: string): Promise<Contrato> {
  return toContrato(await http.get<ContratoDto>(`/contratos/${id}`))
}

export async function obterUrlComprovante(
  id: string,
): Promise<{ url: string; expiraEm: string }> {
  return http.get<{ url: string; expiraEm: string }>(
    `/contratos/${id}/pagamento/comprovante/url`,
  )
}

export async function criarContrato(draft: ContratoDraft): Promise<Contrato> {
  return toContrato(await http.post<ContratoDto>('/contratos', toRequest(draft)))
}

export async function atualizarContrato(
  id: string,
  draft: ContratoDraft,
): Promise<Contrato> {
  return toContrato(await http.put<ContratoDto>(`/contratos/${id}`, toRequest(draft)))
}

export async function excluirContrato(id: string): Promise<void> {
  await http.delete(`/contratos/${id}`)
}

export async function duplicarContrato(id: string): Promise<Contrato> {
  return toContrato(await http.post<ContratoDto>(`/contratos/${id}/duplicar`))
}

export async function listarLinks(contratoId: string): Promise<SolicitacaoAceite[]> {
  const dtos = await http.get<SolicitacaoAceiteDto[]>(`/contratos/${contratoId}/links-aceite`)
  return dtos.map(toSolicitacao)
}

export async function gerarLink(
  contratoId: string,
  expiresInDays = 7,
): Promise<SolicitacaoAceite> {
  const dto = await http.post<SolicitacaoAceiteDto>(
    `/contratos/${contratoId}/links-aceite`,
    { expiresInDays },
  )
  return toSolicitacao(dto)
}

export async function cancelarLink(contratoId: string, linkId: string): Promise<void> {
  await http.post(`/contratos/${contratoId}/links-aceite/${linkId}/cancelar`)
}

export async function reabrirContrato(id: string): Promise<Contrato> {
  return toContrato(await http.post<ContratoDto>(`/contratos/${id}/reabrir`))
}

export async function cancelarContrato(id: string): Promise<Contrato> {
  return toContrato(await http.post<ContratoDto>(`/contratos/${id}/cancelar`))
}

export async function confirmarPagamento(
  id: string,
  confirmadoPor?: string,
): Promise<Contrato> {
  return toContrato(
    await http.post<ContratoDto>(`/contratos/${id}/pagamento/confirmar`, {
      confirmadoPor: confirmadoPor ?? null,
    }),
  )
}

export async function rejeitarPagamento(id: string, motivo: string): Promise<Contrato> {
  return toContrato(
    await http.post<ContratoDto>(`/contratos/${id}/pagamento/rejeitar`, { motivo }),
  )
}

export async function isentarPagamento(id: string): Promise<Contrato> {
  return toContrato(await http.post<ContratoDto>(`/contratos/${id}/pagamento/isentar`))
}

export async function registrarPagamentoFinal(
  id: string,
  pagamento: {
    valor?: number
    formaPagamento?: FormaPagamentoSaldo
    recebidoEm?: string
    recebidoPor?: string
    observacoes?: string
  },
): Promise<Contrato> {
  return toContrato(
    await http.put<ContratoDto>(`/contratos/${id}/pagamento-final`, {
      valor: pagamento.valor ?? null,
      formaPagamento: pagamento.formaPagamento ?? null,
      recebidoEm: pagamento.recebidoEm ?? null,
      recebidoPor: pagamento.recebidoPor ?? null,
      observacoes: pagamento.observacoes ?? null,
    }),
  )
}

export async function isentarPagamentoFinal(id: string): Promise<Contrato> {
  return toContrato(
    await http.post<ContratoDto>(`/contratos/${id}/pagamento-final/isentar`),
  )
}

export async function reabrirPagamentoFinal(id: string): Promise<Contrato> {
  return toContrato(
    await http.post<ContratoDto>(`/contratos/${id}/pagamento-final/reabrir`),
  )
}
