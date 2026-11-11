import type { MidiaGaleria } from '@/domain/galleries'

export type UploadEditadaLoteStatus =
  | 'aguardando'
  | 'enviando'
  | 'concluido'
  | 'erro'

export interface UploadEditadaLoteItem {
  midiaId: string
  file: File
}

export interface UploadEditadaLoteProgresso {
  status: UploadEditadaLoteStatus
  percentual: number
  erro?: string
}

export interface UploadEditadaLoteResultado {
  midiaId: string
  ok: boolean
  erro?: string
}

export interface CorrespondenciaEditada {
  midia: MidiaGaleria
  arquivo: File
}

export interface DuplicidadeEditada {
  midia: MidiaGaleria
  arquivos: File[]
}

export interface ResultadoAssociacaoEditadas {
  correspondencias: CorrespondenciaEditada[]
  semCorrespondencia: File[]
  fotosSemArquivo: MidiaGaleria[]
  duplicados: DuplicidadeEditada[]
}

/** Extrai o numero do prefixo, no padrao do ZIP de selecao: `001_nome.jpg`. */
export function numeroDoArquivo(nome: string): number | null {
  const match = nome.trim().match(/^(\d{1,4})(?:[_\-\s.]|$)/)
  if (!match) return null
  const numero = Number(match[1])
  return Number.isSafeInteger(numero) ? numero : null
}

/** Normaliza nome e extensao para comparar arquivos com a midia original. */
export function normalizarNomeArquivo(nome: string): string {
  return removerAcentos(nome)
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/\s+/g, ' ')
}

function removerPrefixoNumerico(nome: string): string {
  return nome.replace(/^\d{1,4}[_\-\s.]+/, '').trim()
}

function removerAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Associa os arquivos editados as fotos selecionadas.
 *
 * <p>A prioridade e o numero estavel da foto (mesmo numero exibido no grid e
 * usado no ZIP de selecao). Quando nao ha numero, compara o nome original,
 * ignorando extensao, acentos e um eventual prefixo numerico.
 */
export function associarArquivosEditados(
  fotos: MidiaGaleria[],
  arquivos: File[],
): ResultadoAssociacaoEditadas {
  const porNumero = new Map<number, MidiaGaleria>()
  const porNome = new Map<string, MidiaGaleria>()

  for (const foto of fotos) {
    porNumero.set(foto.numero, foto)
    const nome = normalizarNomeArquivo(foto.nomeArquivo)
    porNome.set(nome, foto)
    const semPrefixo = removerPrefixoNumerico(nome)
    if (semPrefixo && semPrefixo !== nome) {
      porNome.set(semPrefixo, foto)
    }
  }

  const candidatos = new Map<string, File[]>()
  const semCorrespondencia: File[] = []

  for (const arquivo of arquivos) {
    const numero = numeroDoArquivo(arquivo.name)
    const nome = normalizarNomeArquivo(arquivo.name)
    const semPrefixo = removerPrefixoNumerico(nome)
    const midia =
      (numero != null ? porNumero.get(numero) : undefined) ??
      porNome.get(nome) ??
      porNome.get(semPrefixo)

    if (!midia) {
      semCorrespondencia.push(arquivo)
      continue
    }

    const lista = candidatos.get(midia.id) ?? []
    lista.push(arquivo)
    candidatos.set(midia.id, lista)
  }

  const correspondencias: CorrespondenciaEditada[] = []
  const fotosSemArquivo: MidiaGaleria[] = []
  const duplicados: DuplicidadeEditada[] = []

  for (const foto of fotos) {
    const lista = candidatos.get(foto.id)
    if (!lista || lista.length === 0) {
      fotosSemArquivo.push(foto)
    } else if (lista.length > 1) {
      duplicados.push({ midia: foto, arquivos: lista })
    } else {
      correspondencias.push({ midia: foto, arquivo: lista[0] })
    }
  }

  return { correspondencias, semCorrespondencia, fotosSemArquivo, duplicados }
}
