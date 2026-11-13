import { describe, expect, it } from 'vitest'

import type { MidiaGaleria } from '@/domain/galleries'
import {
  associarArquivosEditados,
  numeroDoArquivo,
} from '@/features/galleries/lib/editedBatch'

function foto(id: string, numero: number, nomeArquivo: string): MidiaGaleria {
  return {
    id,
    tipo: 'foto',
    nomeArquivo,
    mimeType: 'image/jpeg',
    tamanho: 10,
    status: 'original',
    finalidade: 'edicao',
    numero,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    processamentoStatus: 'disponivel',
  }
}

function arquivo(nome: string): File {
  return new File(['conteudo'], nome, { type: 'image/jpeg' })
}

describe('editedBatch', () => {
  it('extrai o número do padrão do ZIP de seleção', () => {
    expect(numeroDoArquivo('001_foto.jpg')).toBe(1)
    expect(numeroDoArquivo('12-foto.png')).toBe(12)
    expect(numeroDoArquivo('0004.foto.webp')).toBe(4)
    expect(numeroDoArquivo('foto.jpg')).toBeNull()
    expect(numeroDoArquivo('12345_foto.jpg')).toBeNull()
  })

  it('associa pelo número da foto mesmo com nome diferente', () => {
    const fotos = [
      foto('m1', 1, 'primeira.jpg'),
      foto('m2', 2, 'segunda.jpg'),
    ]

    const resultado = associarArquivosEditados(fotos, [
      arquivo('001_outro-nome.jpg'),
      arquivo('2_segunda-editada.jpg'),
    ])

    expect(resultado.correspondencias.map(({ midia }) => midia.id)).toEqual([
      'm1',
      'm2',
    ])
    expect(resultado.semCorrespondencia).toHaveLength(0)
    expect(resultado.fotosSemArquivo).toHaveLength(0)
    expect(resultado.duplicados).toHaveLength(0)
  })

  it('associa pelo nome original ignorando caixa, acento e extensão', () => {
    const fotos = [
      foto('m1', 1, 'Foto Ação.JPG'),
      foto('m2', 2, 'outra-foto.png'),
    ]

    const resultado = associarArquivosEditados(fotos, [
      arquivo('foto acao.jpeg'),
      arquivo('OUTRA-FOTO.webp'),
    ])

    expect(resultado.correspondencias.map(({ midia }) => midia.id)).toEqual([
      'm1',
      'm2',
    ])
  })

  it('associa pelo nome sem o prefixo numérico', () => {
    const fotos = [foto('m1', 1, '001_foto.jpg')]

    const resultado = associarArquivosEditados(fotos, [arquivo('foto.jpg')])

    expect(resultado.correspondencias[0].midia.id).toBe('m1')
  })

  it('separa arquivos sem correspondência e fotos sem arquivo', () => {
    const fotos = [
      foto('m1', 1, 'primeira.jpg'),
      foto('m2', 2, 'segunda.jpg'),
    ]

    const resultado = associarArquivosEditados(fotos, [
      arquivo('999_desconhecida.jpg'),
    ])

    expect(resultado.correspondencias).toHaveLength(0)
    expect(resultado.semCorrespondencia.map((item) => item.name)).toEqual([
      '999_desconhecida.jpg',
    ])
    expect(resultado.fotosSemArquivo.map((item) => item.id)).toEqual(['m1', 'm2'])
  })

  it('marca duplicados e não envia nenhum dos arquivos', () => {
    const fotos = [foto('m1', 1, 'primeira.jpg')]

    const resultado = associarArquivosEditados(fotos, [
      arquivo('001_a.jpg'),
      arquivo('001_b.jpg'),
    ])

    expect(resultado.correspondencias).toHaveLength(0)
    expect(resultado.duplicados).toHaveLength(1)
    expect(resultado.duplicados[0].midia.id).toBe('m1')
    expect(resultado.duplicados[0].arquivos).toHaveLength(2)
  })
})
