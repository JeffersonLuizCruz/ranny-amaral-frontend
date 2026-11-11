import type {
  EntregaGaleria,
  EventoGaleria,
  FaixaAplicada,
  GaleriaEnsaio,
  GaleriaStatus,
  MidiaGaleria,
  PedidoExtras,
  ResumoExtras,
  SelecaoGaleria,
} from '@/domain/galleries'
import type { FaixaFotoExtra } from '@/domain/types'
import { toMidia, type MidiaDto } from '@/features/galleries/api/midiaMapper'
import { http, apiUrl } from '@/shared/api/httpClient'
import { toQuery } from '@/shared/api/query'
import type { Pagina } from '@/shared/api/types'

interface GaleriaDto {
  id: string
  agendamentoId: string
  contratoId: string | null
  clienteId: string | null
  clienteNome: string | null
  status: string
  fotosInclusas: number
  videosInclusos: number
  valorFotoExtra: number
  faixasFotoExtra: FaixaFotoExtra[] | null
  totalFotos: number
  totalVideos: number
  fotosDisponiveis: number
  videosDisponiveis: number
  rawLiberado: boolean
  rawLiberadoEm: string | null
  rawLiberadoPor: string | null
  zipBaixadoEm: string | null
  capaUrl: string | null
  createdAt: string
  updatedAt: string
}

interface LinkDto {
  id: string
  tipo: 'selecao' | 'entrega'
  token: string
  status: 'ativo' | 'expirado' | 'revogado'
  expiraEm: string
  visualizadaEm: string | null
  protocolo: string | null
}

interface SelecaoDto {
  id: string
  protocolo: string
  status: string
  fotosSelecionadas: number
  videosSelecionados: number
  fotosExtras: number
  valorExtras: number
  enviadaEm: string
  fotoIds: string[]
  videoIds: string[]
}

export interface ExtrasDto {
  id: string
  quantidadeFotos: number
  valorUnitario: number
  valorMedioUnitario: number
  valorTotal: number
  detalhamento: FaixaAplicada[]
  status: 'pendente' | 'pago' | 'isento' | 'cancelado'
  formaPagamento: string | null
  confirmadoEm: string | null
  confirmadoPor: string | null
  liberacaoMotivo: string | null
  liberadoPor: string | null
  liberadoEm: string | null
  chavePix: string | null
  instrucoesPagamento: string | null
  comprovanteNome: string | null
  comprovanteEnviadoEm: string | null
  comprovanteUrl: string | null
}

interface ResumoExtrasDto {
  quantidadeTotal: number
  valorTotal: number
  quantidadeCoberta: number
  valorCoberto: number
  quantidadePendente: number
  valorPendente: number
}

interface EventoDto {
  id: string
  tipo: string
  detalhe: string | null
  em: string
}

interface GaleriaDetalheDto {
  galeria: GaleriaDto
  links: LinkDto[]
  selecao: SelecaoDto | null
  extras: ExtrasDto | null
  pedidosExtras?: ExtrasDto[]
  resumoExtras?: ResumoExtrasDto | null
  historico: EventoDto[]
}

export interface GaleriaDetalhe {
  galeria: GaleriaEnsaio
  links: LinkDto[]
  selecao?: SelecaoGaleria
  extras?: PedidoExtras
  pedidosExtras?: PedidoExtras[]
  resumoExtras?: ResumoExtras
  historico: EventoGaleria[]
}

export interface GaleriasFiltros {
  status?: GaleriaStatus | 'todas'
  q?: string
  baixada?: boolean
  pagina?: number
  tamanho?: number
}

function toSelecao(dto: SelecaoDto | null): SelecaoGaleria | undefined {
  if (!dto) return undefined
  return {
    status: dto.status === 'enviada' ? 'enviada' : 'rascunho',
    protocolo: dto.protocolo,
    fotoIds: dto.fotoIds,
    videoIds: dto.videoIds,
    fotosExtras: dto.fotosExtras,
    valorExtras: dto.valorExtras,
    enviadaEm: dto.enviadaEm,
  }
}

export function toExtras(dto: ExtrasDto | null): PedidoExtras | undefined {
  if (!dto) return undefined
  return {
    id: dto.id,
    quantidadeFotos: dto.quantidadeFotos,
    valorUnitario: dto.valorUnitario,
    valorMedioUnitario: dto.valorMedioUnitario,
    valorTotal: dto.valorTotal,
    detalhamento: dto.detalhamento ?? [],
    status: dto.status,
    formaPagamento: (dto.formaPagamento ?? undefined) as PedidoExtras['formaPagamento'],
    confirmadoEm: dto.confirmadoEm ?? undefined,
    confirmadoPor: dto.confirmadoPor ?? undefined,
    liberacaoManual:
      dto.liberadoEm && dto.liberadoPor
        ? {
            por: dto.liberadoPor,
            em: dto.liberadoEm,
            motivo: dto.liberacaoMotivo ?? '',
          }
        : undefined,
    chavePix: dto.chavePix ?? undefined,
    instrucoesPagamento: dto.instrucoesPagamento ?? undefined,
    comprovanteNome: dto.comprovanteNome ?? undefined,
    comprovanteEnviadoEm: dto.comprovanteEnviadoEm ?? undefined,
    comprovanteUrl: dto.comprovanteUrl ?? undefined,
  }
}

export function toResumoExtras(
  dto: ResumoExtrasDto | null | undefined,
): ResumoExtras | undefined {
  if (!dto) return undefined
  return {
    quantidadeTotal: dto.quantidadeTotal,
    valorTotal: dto.valorTotal,
    quantidadeCoberta: dto.quantidadeCoberta,
    valorCoberto: dto.valorCoberto,
    quantidadePendente: dto.quantidadePendente,
    valorPendente: dto.valorPendente,
  }
}

function toEntrega(
  links: LinkDto[],
  zipBaixadoEm?: string,
): EntregaGaleria | undefined {
  const link = links.find((item) => item.tipo === 'entrega')
  if (!link) return undefined
  return {
    token: link.token,
    status:
      link.status === 'ativo'
        ? 'disponivel'
        : link.status === 'revogado'
          ? 'revogada'
          : 'nao_publicada',
    publicadaEm: link.visualizadaEm ?? undefined,
    expiraEm: link.expiraEm,
    primeiroDownloadEm: zipBaixadoEm,
    quantidadeDownloads: 0,
    downloads: [],
  }
}

function toEvento(dto: EventoDto): EventoGaleria {
  const tipo = dto.tipo as EventoGaleria['tipo']
  return {
    id: dto.id,
    tipo,
    em: dto.em,
    detalhe: dto.detalhe ?? undefined,
  }
}

function toGaleria(
  dto: GaleriaDto,
  links: LinkDto[] = [],
  selecao?: SelecaoGaleria,
  extras?: PedidoExtras,
  historico: EventoGaleria[] = [],
  pedidosExtras?: PedidoExtras[],
  resumoExtras?: ResumoExtras,
): GaleriaEnsaio {
  const linkSelecao = links.find((item) => item.tipo === 'selecao')
  return {
    id: dto.id,
    agendamentoId: dto.agendamentoId,
    contratoId: dto.contratoId ?? undefined,
    clienteNome: dto.clienteNome ?? undefined,
    status: dto.status as GaleriaStatus,
    fotosInclusas: dto.fotosInclusas,
    videosInclusos: dto.videosInclusos,
    valorFotoExtra: dto.valorFotoExtra,
    faixasFotoExtra: dto.faixasFotoExtra ?? [],
    totalFotos: dto.totalFotos,
    totalVideos: dto.totalVideos,
    fotosDisponiveis: dto.fotosDisponiveis,
    videosDisponiveis: dto.videosDisponiveis,
    rawLiberado: dto.rawLiberado,
    rawLiberadoEm: dto.rawLiberadoEm ?? undefined,
    rawLiberadoPor: dto.rawLiberadoPor ?? undefined,
    zipBaixadoEm: dto.zipBaixadoEm ?? undefined,
    tokenSelecao: linkSelecao?.token,
    prazoSelecaoEm: linkSelecao?.expiraEm,
    midias: [],
    selecao,
    pedidoExtras: extras,
    pedidosExtras,
    resumoExtras,
    entrega: toEntrega(links, dto.zipBaixadoEm ?? undefined),
    historico,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export function atualizarGaleriaNaLista(
  galerias: GaleriaEnsaio[],
  atualizada: GaleriaEnsaio,
): GaleriaEnsaio[] {
  const existe = galerias.some((galeria) => galeria.id === atualizada.id)
  return existe
    ? galerias.map((galeria) => (galeria.id === atualizada.id ? atualizada : galeria))
    : [atualizada, ...galerias]
}

export async function listarGalerias(
  filtros: GaleriasFiltros = {},
): Promise<Pagina<GaleriaEnsaio>> {
  const query = toQuery({
    status: filtros.status === 'todas' ? undefined : filtros.status,
    q: filtros.q,
    baixada: filtros.baixada,
    pagina: filtros.pagina,
    tamanho: filtros.tamanho,
  })
  const dto = await http.get<Pagina<GaleriaDto>>(`/galerias${query}`)
  return { ...dto, itens: dto.itens.map((item) => toGaleria(item)) }
}

export async function criarGaleria(agendamentoId: string): Promise<GaleriaEnsaio> {
  const dto = await http.post<GaleriaDto>('/galerias', { agendamentoId })
  return toGaleria(dto)
}

export async function buscarGaleria(id: string): Promise<GaleriaDetalhe> {
  const dto = await http.get<GaleriaDetalheDto>(`/galerias/${id}`)
  const selecao = toSelecao(dto.selecao)
  const extras = toExtras(dto.extras)
  const pedidosExtras = dto.pedidosExtras?.map((item) => toExtras(item)!).filter(Boolean)
  const resumoExtras = toResumoExtras(dto.resumoExtras)
  const historico = dto.historico.map(toEvento)
  return {
    galeria: toGaleria(
      dto.galeria,
      dto.links,
      selecao,
      extras,
      historico,
      pedidosExtras,
      resumoExtras,
    ),
    links: dto.links,
    selecao,
    extras,
    pedidosExtras,
    resumoExtras,
    historico,
  }
}

export async function listarMidias(
  galeriaId: string,
  pagina = 0,
  tamanho = 100,
): Promise<Pagina<MidiaGaleria>> {
  const query = toQuery({ pagina, tamanho })
  const dto = await http.get<Pagina<MidiaDto>>(`/galerias/${galeriaId}/midias${query}`)
  return { ...dto, itens: dto.itens.map(toMidia) }
}

export async function removerMidia(galeriaId: string, midiaId: string): Promise<void> {
  await http.delete(`/galerias/${galeriaId}/midias/${midiaId}`)
}

export async function publicarSelecao(galeriaId: string): Promise<LinkDto> {
  return http.post<LinkDto>(`/galerias/${galeriaId}/selecao/publicar`)
}

export async function reabrirSelecao(galeriaId: string): Promise<LinkDto> {
  return http.post<LinkDto>(`/galerias/${galeriaId}/selecao/reabrir`)
}

export async function confirmarExtras(
  galeriaId: string,
  formaPagamento: 'pix' | 'dinheiro' | 'outro',
): Promise<void> {
  await http.post(`/galerias/${galeriaId}/extras/confirmar`, {
    formaPagamento,
    confirmadoPor: 'Equipe do estúdio',
  })
}

export async function isentarExtras(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/extras/isentar`)
}

export async function liberarEdicao(galeriaId: string, motivo: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/edicao/liberar`, {
    motivo,
    por: 'Equipe do estúdio',
  })
}

export async function publicarEntrega(galeriaId: string): Promise<LinkDto> {
  return http.post<LinkDto>(`/galerias/${galeriaId}/entrega/publicar`)
}

export async function revogarEntrega(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/entrega/revogar`)
}

export async function liberarRaw(galeriaId: string, por?: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/entrega/liberar-raw`, { por })
}

export async function revogarRaw(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/entrega/revogar-raw`)
}

export interface DownloadSelecao {
  url: string
  expiraEm: string
  quantidade: number
}

/** Gera a URL temporaria do ZIP com as fotos selecionadas para edicao. */
export async function prepararDownloadSelecao(
  galeriaId: string,
): Promise<DownloadSelecao> {
  return http.post<DownloadSelecao>(`/galerias/${galeriaId}/selecao/download`)
}

export async function consultarGaleriaPublica(token: string): Promise<{
  link: LinkDto
  galeria: GaleriaEnsaio
  midias: MidiaGaleria[]
  selecao?: SelecaoGaleria
  extras?: PedidoExtras
  resumoExtras?: ResumoExtras
  midiasEntregues?: string[]
  entregaDisponivel: boolean
}> {
  interface PublicaDto {
    link: LinkDto
    galeria: GaleriaDto
    midias: MidiaDto[]
    selecao: SelecaoDto | null
    extras: ExtrasDto | null
    resumoExtras?: ResumoExtrasDto | null
    midiasEntregues?: string[]
    entregaDisponivel: boolean
  }
  const dto = await http.get<PublicaDto>(`/public/galerias/${token}`)
  const selecao = toSelecao(dto.selecao)
  const extras = toExtras(dto.extras)
  const resumoExtras = toResumoExtras(dto.resumoExtras)
  return {
    link: dto.link,
    galeria: toGaleria(
      dto.galeria,
      [dto.link],
      selecao,
      extras,
      [],
      undefined,
      resumoExtras,
    ),
    midias: dto.midias.map(toMidia),
    selecao,
    extras,
    resumoExtras,
    midiasEntregues: dto.midiasEntregues ?? [],
    entregaDisponivel: dto.entregaDisponivel,
  }
}

export async function enviarSelecaoPublica(
  token: string,
  fotoIds: string[],
  videoIds: string[],
): Promise<SelecaoGaleria> {
  const dto = await http.post<SelecaoDto>(`/public/galerias/${token}/selecao`, {
    fotoIds,
    videoIds,
  })
  return toSelecao(dto)!
}

export async function baixarMidiaPublica(
  token: string,
  midiaId: string,
  versao: 'editada' | 'original' = 'editada',
): Promise<{ url: string; expiraEm: string; nomeArquivo: string }> {
  return http.post(`/public/galerias/${token}/download`, { midiaId, versao })
}

/** Valida o ZIP antes da navegacao; devolve a quantidade de arquivos. */
export async function validarZipPublico(
  token: string,
  versao: 'editada' | 'original',
): Promise<number> {
  const dto = await http.get<{ quantidade: number }>(
    `/public/galerias/${token}/download-zip/validar?versao=${versao}`,
  )
  return dto.quantidade
}

/** URL do ZIP streaming; usada em navegacao direta para nao carregar em memoria. */
export function urlZipPublico(
  token: string,
  versao: 'editada' | 'original',
): string {
  return apiUrl(`/public/galerias/${token}/download-zip?versao=${versao}`)
}

export type { GaleriaDto, LinkDto, MidiaDto }
