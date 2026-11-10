import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import { isHexColor, normalizeHex } from '@/shared/lib/colors'
import { parseCurrencyInput } from '@/shared/lib/currency'

export interface FaixaFotoExtraFormValue {
  quantidadeMinima: string
  valorUnitario: string
}

export interface PackageFormValues {
  nome: string
  duracaoMinutos: string
  valor: string
  descricao: string
  corHex: string
  itensInclusos: string[]
  ativo: boolean
  quantidadeFotosInclusas: string
  quantidadeVideosInclusos: string
  valorFotoExtra: string
  faixasFotoExtra: FaixaFotoExtraFormValue[]
  promocaoAtiva: boolean
  promocaoValor: string
  promocaoValidaAte: string
  promocaoRotulo: string
}

export type PackageFormErrors = Partial<
  Record<
    | 'nome'
    | 'duracaoMinutos'
    | 'valor'
    | 'corHex'
    | 'quantidadeFotosInclusas'
    | 'quantidadeVideosInclusos'
    | 'valorFotoExtra'
    | 'faixasFotoExtra'
    | 'promocaoValor',
    string
  >
>

export function createEmptyPackageValues(): PackageFormValues {
  return {
    nome: '',
    duracaoMinutos: '60',
    valor: '',
    descricao: '',
    corHex: '#7C3AED',
    itensInclusos: [],
    ativo: true,
    quantidadeFotosInclusas: '0',
    quantidadeVideosInclusos: '0',
    valorFotoExtra: '',
    faixasFotoExtra: [],
    promocaoAtiva: false,
    promocaoValor: '',
    promocaoValidaAte: '',
    promocaoRotulo: '',
  }
}

export function packageToFormValues(pacote: PacoteFotografico): PackageFormValues {
  return {
    nome: pacote.nome,
    duracaoMinutos: String(pacote.duracaoMinutos),
    valor: String(pacote.valor),
    descricao: pacote.descricao,
    corHex: pacote.corHex,
    itensInclusos: pacote.itensInclusos,
    ativo: pacote.ativo,
    quantidadeFotosInclusas: String(pacote.quantidadeFotosInclusas),
    quantidadeVideosInclusos: String(pacote.quantidadeVideosInclusos),
    valorFotoExtra: String(pacote.valorFotoExtra),
    faixasFotoExtra: (pacote.faixasFotoExtra ?? []).map((faixa) => ({
      quantidadeMinima: String(faixa.quantidadeMinima),
      valorUnitario: String(faixa.valorUnitario),
    })),
    promocaoAtiva: Boolean(pacote.promocao?.ativa),
    promocaoValor: pacote.promocao ? String(pacote.promocao.valorPromocional) : '',
    promocaoValidaAte: pacote.promocao?.validaAte?.slice(0, 10) ?? '',
    promocaoRotulo: pacote.promocao?.rotulo ?? '',
  }
}

export function validatePackageForm(values: PackageFormValues): {
  errors: PackageFormErrors
  draft?: PacoteDraft
} {
  const errors: PackageFormErrors = {}
  const nome = values.nome.trim()
  const duracao = Number(values.duracaoMinutos)
  const valor = parseCurrencyInput(values.valor)
  const corHex = normalizeHex(values.corHex)
  const quantidadeFotosInclusas = Number(values.quantidadeFotosInclusas)
  const quantidadeVideosInclusos = Number(values.quantidadeVideosInclusos)
  const valorFotoExtra = values.valorFotoExtra.trim()
    ? parseCurrencyInput(values.valorFotoExtra)
    : quantidadeFotosInclusas > 0
      ? Math.round((valor / quantidadeFotosInclusas) * 100) / 100
      : 0
  const promocaoValor = parseCurrencyInput(values.promocaoValor)

  if (!nome) errors.nome = 'Dê um nome ao pacote.'
  if (!Number.isFinite(duracao) || duracao < 15) {
    errors.duracaoMinutos = 'A duração mínima é de 15 minutos.'
  }
  if (!values.valor.trim() || !Number.isFinite(valor) || valor < 0) {
    errors.valor = 'Informe um valor válido.'
  }
  if (!isHexColor(values.corHex)) {
    errors.corHex = 'Escolha uma cor válida.'
  }
  if (
    !Number.isInteger(quantidadeFotosInclusas) ||
    quantidadeFotosInclusas < 0
  ) {
    errors.quantidadeFotosInclusas = 'Informe uma quantidade válida.'
  }
  if (
    !Number.isInteger(quantidadeVideosInclusos) ||
    quantidadeVideosInclusos < 0
  ) {
    errors.quantidadeVideosInclusos = 'Informe uma quantidade válida.'
  }
  if (quantidadeFotosInclusas + quantidadeVideosInclusos <= 0) {
    errors.quantidadeFotosInclusas = 'Inclua pelo menos uma foto ou vídeo.'
  }
  if (!Number.isFinite(valorFotoExtra) || valorFotoExtra < 0) {
    errors.valorFotoExtra = 'Informe um valor válido para a foto extra.'
  }

  const faixasFotoExtra = values.faixasFotoExtra.map((faixa) => ({
    quantidadeMinima: Number(faixa.quantidadeMinima),
    valorUnitario: parseCurrencyInput(faixa.valorUnitario),
  }))
  const minimos = new Set<number>()
  for (const faixa of faixasFotoExtra) {
    if (!Number.isInteger(faixa.quantidadeMinima) || faixa.quantidadeMinima < 2) {
      errors.faixasFotoExtra = 'A primeira faixa deve começar na 2ª foto extra.'
      break
    }
    if (
      !Number.isFinite(faixa.valorUnitario) ||
      faixa.valorUnitario < 0
    ) {
      errors.faixasFotoExtra = 'Informe um valor válido para cada faixa.'
      break
    }
    if (minimos.has(faixa.quantidadeMinima)) {
      errors.faixasFotoExtra = 'Não repita a mesma quantidade mínima nas faixas.'
      break
    }
    minimos.add(faixa.quantidadeMinima)
  }
  const faixasOrdenadas = [...faixasFotoExtra].sort(
    (a, b) => a.quantidadeMinima - b.quantidadeMinima,
  )
  if (values.promocaoAtiva) {
    if (
      !values.promocaoValor.trim() ||
      !Number.isFinite(promocaoValor) ||
      promocaoValor <= 0
    ) {
      errors.promocaoValor = 'Informe o valor promocional.'
    } else if (promocaoValor >= valor) {
      errors.promocaoValor = 'O valor promocional deve ser menor que o valor de tabela.'
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    draft: {
      nome,
      duracaoMinutos: duracao,
      valor,
      descricao: values.descricao.trim(),
      corHex,
      itensInclusos: values.itensInclusos.map((item) => item.trim()).filter(Boolean),
      ativo: values.ativo,
      quantidadeFotosInclusas,
      quantidadeVideosInclusos,
      valorFotoExtra,
      faixasFotoExtra: faixasOrdenadas,
      promocao: values.promocaoAtiva
        ? {
            ativa: true,
            valorPromocional: promocaoValor,
            validaAte: values.promocaoValidaAte || undefined,
            rotulo: values.promocaoRotulo.trim() || undefined,
          }
        : undefined,
    },
  }
}
