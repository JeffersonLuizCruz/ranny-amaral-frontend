import type { CondicoesPacote, PacoteFotografico } from '@/domain/types'

export function promocaoVigente(pacote: PacoteFotografico, now = new Date()): boolean {
  if (!pacote.promocao?.ativa) return false
  if (!pacote.promocao.validaAte) return true
  const validade = new Date(pacote.promocao.validaAte)
  return Number.isFinite(validade.getTime()) && validade.getTime() >= now.getTime()
}

export function valorEfetivoPacote(
  pacote: PacoteFotografico,
  aplicarPromocao: boolean,
  now = new Date(),
): number {
  if (aplicarPromocao && promocaoVigente(pacote, now)) {
    return pacote.promocao?.valorPromocional ?? pacote.valor
  }
  return pacote.valor
}

export function descontoPacote(pacote: PacoteFotografico, aplicarPromocao: boolean): number {
  if (!aplicarPromocao || !promocaoVigente(pacote)) return 0
  return Math.max(0, pacote.valor - (pacote.promocao?.valorPromocional ?? pacote.valor))
}

export function buildCondicoesPacote(
  pacote: PacoteFotografico,
  aplicarPromocao: boolean,
): CondicoesPacote {
  const usarPromocao = aplicarPromocao && promocaoVigente(pacote)

  return {
    quantidadeFotosInclusas: pacote.quantidadeFotosInclusas,
    quantidadeVideosInclusos: pacote.quantidadeVideosInclusos,
    valorFotoExtra: pacote.valorFotoExtra,
    faixasFotoExtra: pacote.faixasFotoExtra ?? [],
    valorTabela: pacote.valor,
    promocaoAplicada: usarPromocao
      ? {
          valorPromocional: pacote.promocao?.valorPromocional ?? pacote.valor,
          rotulo: pacote.promocao?.rotulo,
        }
      : undefined,
  }
}

export function valorUnitarioFoto(pacote: PacoteFotografico): number {
  if (pacote.quantidadeFotosInclusas <= 0) return 0
  return Math.round((pacote.valor / pacote.quantidadeFotosInclusas) * 100) / 100
}
