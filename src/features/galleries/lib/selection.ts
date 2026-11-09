import type { GaleriaEnsaio, MidiaGaleria } from '@/domain/galleries'
import { contarMidias } from '@/domain/galleries'
import type { Contrato } from '@/domain/contracts'
import type {
  AgendamentoEnsaio,
  CondicoesPacote,
  PacoteFotografico,
} from '@/domain/types'

export interface CondicoesGaleria {
  fotosInclusas: number
  videosInclusos: number
  valorFotoExtra: number
}

export interface ResultadoSelecao {
  fotosSelecionadas: number
  videosSelecionados: number
  fotosExtras: number
  valorExtras: number
}

export interface ValidacaoSelecao {
  ok: boolean
  erros: string[]
  resultado: ResultadoSelecao
}

export interface GatePublicacao {
  ok: boolean
  motivos: string[]
}

export function getCondicoesGaleria(
  appointment?: AgendamentoEnsaio,
  pacote?: PacoteFotografico,
): CondicoesGaleria {
  const condicoes: Partial<CondicoesPacote> | undefined = appointment?.condicoesPacote

  return {
    fotosInclusas:
      condicoes?.quantidadeFotosInclusas ??
      pacote?.quantidadeFotosInclusas ??
      0,
    videosInclusos:
      condicoes?.quantidadeVideosInclusos ??
      pacote?.quantidadeVideosInclusos ??
      0,
    valorFotoExtra: condicoes?.valorFotoExtra ?? pacote?.valorFotoExtra ?? 0,
  }
}

export function calcularResultadoSelecao(
  fotosSelecionadas: number,
  videosSelecionados: number,
  condicoes: CondicoesGaleria,
): ResultadoSelecao {
  const fotosExtras = Math.max(0, fotosSelecionadas - condicoes.fotosInclusas)
  const valorExtras =
    Math.round(fotosExtras * condicoes.valorFotoExtra * 100) / 100

  return {
    fotosSelecionadas,
    videosSelecionados,
    fotosExtras,
    valorExtras,
  }
}

export function validarSelecao(
  fotoIds: string[],
  videoIds: string[],
  condicoes: CondicoesGaleria,
): ValidacaoSelecao {
  const erros: string[] = []
  const resultado = calcularResultadoSelecao(
    fotoIds.length,
    videoIds.length,
    condicoes,
  )

  if (fotoIds.length < condicoes.fotosInclusas) {
    erros.push(
      `Selecione todas as ${condicoes.fotosInclusas} fotos inclusas no pacote.`,
    )
  }

  if (videoIds.length !== condicoes.videosInclusos) {
    erros.push(
      condicoes.videosInclusos === 1
        ? 'Selecione o vídeo incluso no pacote.'
        : `Selecione exatamente ${condicoes.videosInclusos} vídeos inclusos no pacote.`,
    )
  }

  return { ok: erros.length === 0, erros, resultado }
}

export function selecaoExpirada(galeria: GaleriaEnsaio, now = new Date()): boolean {
  if (!galeria.prazoSelecaoEm) return false
  const prazo = new Date(galeria.prazoSelecaoEm)
  return Number.isFinite(prazo.getTime()) && prazo.getTime() < now.getTime()
}

export function entregaExpirada(galeria: GaleriaEnsaio, now = new Date()): boolean {
  const entrega = galeria.entrega
  if (!entrega?.expiraEm) return false
  const prazo = new Date(entrega.expiraEm)
  return Number.isFinite(prazo.getTime()) && prazo.getTime() < now.getTime()
}

export function entregaDisponivel(galeria: GaleriaEnsaio, now = new Date()): boolean {
  return (
    galeria.status === 'entregue' &&
    galeria.entrega?.status === 'disponivel' &&
    !entregaExpirada(galeria, now)
  )
}

export function podePublicarSelecao(input: {
  galeria: GaleriaEnsaio
  appointment?: AgendamentoEnsaio
  contrato?: Contrato
  pacote?: PacoteFotografico
}): GatePublicacao {
  const { galeria, appointment, contrato, pacote } = input
  const motivos: string[] = []
  const condicoes = getCondicoesGaleria(appointment, pacote)

  if (!appointment || appointment.status !== 'realizado') {
    motivos.push('Marque o ensaio como realizado antes de publicar a galeria.')
  }

  const entradaQuitada = contrato?.entradaQuitada ?? appointment?.entradaQuitada ?? false
  const saldoQuitado = contrato?.saldoQuitado ?? appointment?.saldoQuitado ?? false

  if (!entradaQuitada) {
    motivos.push('A entrada do ensaio ainda não foi confirmada.')
  }
  if (!saldoQuitado) {
    motivos.push('Registre o recebimento integral do saldo final antes de publicar a galeria.')
  }

  const fotos = contarMidias(galeria.midias, 'foto')
  const videos = contarMidias(galeria.midias, 'video')

  if (fotos < condicoes.fotosInclusas) {
    motivos.push(
      `Envie pelo menos ${condicoes.fotosInclusas} fotos (${fotos} enviadas).`,
    )
  }
  if (videos < condicoes.videosInclusos) {
    motivos.push(
      `Envie pelo menos ${condicoes.videosInclusos} vídeos (${videos} enviados).`,
    )
  }

  return { ok: motivos.length === 0, motivos }
}

export function contarSelecao(
  galeria: GaleriaEnsaio,
  fotos: MidiaGaleria[],
  videos: MidiaGaleria[],
): { fotos: number; videos: number } {
  const fotoIds = new Set(galeria.selecao?.fotoIds ?? [])
  const videoIds = new Set(galeria.selecao?.videoIds ?? [])

  return {
    fotos: fotos.filter((midia) => fotoIds.has(midia.id)).length,
    videos: videos.filter((midia) => videoIds.has(midia.id)).length,
  }
}
