import type {
  EntregaGaleria,
  EventoGaleria,
  GaleriaEnsaio,
  GaleriaStatus,
  MidiaGaleria,
  PedidoExtras,
  SelecaoGaleria,
} from '@/domain/galleries'
import { toMidia, type MidiaDto } from '@/features/galleries/api/midiaMapper'
import { http } from '@/shared/api/httpClient'
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
  totalFotos: number
  totalVideos: number
  fotosDisponiveis: number
  videosDisponiveis: number
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

interface ExtrasDto {
  id: string
  quantidadeFotos: number
  valorUnitario: number
  valorTotal: number
  status: 'pendente' | 'pago' | 'isento' | 'cancelado'
  formaPagamento: string | null
  confirmadoEm: string | null
  confirmadoPor: string | null
  liberacaoMotivo: string | null
  liberadoPor: string | null
  liberadoEm: string | null
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
  historico: EventoDto[]
}

export interface GaleriaDetalhe {
  galeria: GaleriaEnsaio
  links: LinkDto[]
  selecao?: SelecaoGaleria
  extras?: PedidoExtras
  historico: EventoGaleria[]
}

export interface GaleriasFiltros {
  status?: GaleriaStatus | 'todas'
  q?: string
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

function toExtras(dto: ExtrasDto | null): PedidoExtras | undefined {
  if (!dto) return undefined
  return {
    id: dto.id,
    quantidadeFotos: dto.quantidadeFotos,
    valorUnitario: dto.valorUnitario,
    valorTotal: dto.valorTotal,
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
  }
}

function toEntrega(links: LinkDto[]): EntregaGaleria | undefined {
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
    totalFotos: dto.totalFotos,
    totalVideos: dto.totalVideos,
    fotosDisponiveis: dto.fotosDisponiveis,
    videosDisponiveis: dto.videosDisponiveis,
    tokenSelecao: linkSelecao?.token,
    prazoSelecaoEm: linkSelecao?.expiraEm,
    midias: [],
    selecao,
    pedidoExtras: extras,
    entrega: toEntrega(links),
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
  const historico = dto.historico.map(toEvento)
  return {
    galeria: toGaleria(dto.galeria, dto.links, selecao, extras, historico),
    links: dto.links,
    selecao,
    extras,
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

export async function iniciarEdicao(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/edicao/iniciar`)
}

export async function marcarProntaEntrega(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/pronta-entrega`)
}

export async function publicarEntrega(galeriaId: string): Promise<LinkDto> {
  return http.post<LinkDto>(`/galerias/${galeriaId}/entrega/publicar`)
}

export async function revogarEntrega(galeriaId: string): Promise<void> {
  await http.post(`/galerias/${galeriaId}/entrega/revogar`)
}

export async function consultarGaleriaPublica(token: string): Promise<{
  link: LinkDto
  galeria: GaleriaEnsaio
  midias: MidiaGaleria[]
  selecao?: SelecaoGaleria
  extras?: PedidoExtras
  entregaDisponivel: boolean
}> {
  interface PublicaDto {
    link: LinkDto
    galeria: GaleriaDto
    midias: MidiaDto[]
    selecao: SelecaoDto | null
    extras: ExtrasDto | null
    entregaDisponivel: boolean
  }
  const dto = await http.get<PublicaDto>(`/public/galerias/${token}`)
  const selecao = toSelecao(dto.selecao)
  const extras = toExtras(dto.extras)
  return {
    link: dto.link,
    galeria: toGaleria(dto.galeria, [dto.link], selecao, extras),
    midias: dto.midias.map(toMidia),
    selecao,
    extras,
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
): Promise<{ url: string; expiraEm: string; nomeArquivo: string }> {
  return http.post(`/public/galerias/${token}/download`, { midiaId })
}

export type { GaleriaDto, LinkDto, MidiaDto }
