import type {
  ClausulaModelo,
  ModeloContrato,
  ModeloContratoDraft,
} from '@/domain/contracts'
import { createId } from '@/shared/lib/id'

export interface TemplateFormValues {
  nome: string
  descricao: string
  ativo: boolean
  clausulas: ClausulaModelo[]
}

export type TemplateFormErrors = Partial<Record<'nome' | 'clausulas', string>>

export function createEmptyTemplateValues(): TemplateFormValues {
  return {
    nome: '',
    descricao: '',
    ativo: true,
    clausulas: [
      {
        id: createId('cl'),
        titulo: '1. Objeto',
        corpo:
          'O presente contrato tem por objeto a prestação de serviços fotográficos por {{estudio.nome}} ao contratante {{cliente.nome}}.',
      },
    ],
  }
}

export function templateToFormValues(modelo: ModeloContrato): TemplateFormValues {
  return {
    nome: modelo.nome,
    descricao: modelo.descricao,
    ativo: modelo.ativo,
    clausulas: modelo.clausulas.map((clausula) => ({ ...clausula })),
  }
}

export function validateTemplateForm(values: TemplateFormValues): {
  errors: TemplateFormErrors
  draft?: ModeloContratoDraft
} {
  const errors: TemplateFormErrors = {}
  const nome = values.nome.trim()
  const clausulas = values.clausulas.map((clausula) => ({
    ...clausula,
    titulo: clausula.titulo.trim(),
    corpo: clausula.corpo.trim(),
  }))

  if (!nome) errors.nome = 'Dê um nome ao modelo.'
  if (clausulas.length === 0) {
    errors.clausulas = 'Adicione pelo menos uma cláusula.'
  } else if (clausulas.some((clausula) => !clausula.titulo || !clausula.corpo)) {
    errors.clausulas = 'Todas as cláusulas precisam de título e conteúdo.'
  }

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    draft: {
      nome,
      descricao: values.descricao.trim(),
      ativo: values.ativo,
      clausulas,
    },
  }
}
