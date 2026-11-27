import type { Contrato } from './contracts'

/**
 * Fila operacional do contrato.
 *
 * Cada valor representa o próximo passo de uma pendência. As filas são
 * mutuamente exclusivas para que o mesmo contrato não apareça em duas listas.
 */
export type ContratoSituacao =
  | 'todos'
  | 'aguardando_aceite'
  | 'entrada_em_aberto'
  | 'comprovante_em_analise'

export interface SituacaoContratoMeta {
  label: string
  description: string
}

export const SITUACAO_CONTRATO_META: Record<
  ContratoSituacao,
  SituacaoContratoMeta
> = {
  todos: {
    label: 'Todos',
    description: 'Todos os contratos, independentemente da pendência.',
  },
  aguardando_aceite: {
    label: 'Cliente não aceitou',
    description: 'O cliente ainda precisa aceitar o contrato.',
  },
  entrada_em_aberto: {
    label: 'Falta pagar a entrada',
    description: 'O contrato já foi aceito, mas a entrada ainda não foi paga.',
  },
  comprovante_em_analise: {
    label: 'Comprovantes para aprovar',
    description: 'O cliente enviou o comprovante e aguarda a sua aprovação.',
  },
}

export const SITUACOES_CONTRATO: ContratoSituacao[] = [
  'todos',
  'aguardando_aceite',
  'entrada_em_aberto',
  'comprovante_em_analise',
]

/**
 * Comprovante enviado, ainda não aprovado e sem rejeição registrada.
 * É a única situação que depende de uma ação do staff.
 */
export function contratoComComprovanteEmAnalise(contrato: Contrato): boolean {
  return (
    contrato.statusEntrada === 'pendente' &&
    Boolean(contrato.pagamento.comprovante) &&
    !contrato.pagamento.rejeicao
  )
}

/**
 * Contrato aguardando o cliente aceitar (link pendente ou expirado).
 * Um comprovante em análise tem prioridade e não entra nesta fila.
 */
export function contratoAguardandoAceite(contrato: Contrato): boolean {
  return (
    (contrato.statusAceite === 'pendente' ||
      contrato.statusAceite === 'expirado') &&
    !contratoComComprovanteEmAnalise(contrato)
  )
}

/**
 * Contrato já aceito com entrada pendente e sem comprovante aguardando análise.
 * Inclui comprovante rejeitado, que precisa ser reenviado pelo cliente.
 */
export function contratoComEntradaEmAberto(contrato: Contrato): boolean {
  return (
    contrato.statusAceite === 'aceito' &&
    contrato.statusEntrada === 'pendente' &&
    !contratoComComprovanteEmAnalise(contrato)
  )
}

export function contratoPertenceSituacao(
  contrato: Contrato,
  situacao: ContratoSituacao,
): boolean {
  switch (situacao) {
    case 'todos':
      return true
    case 'comprovante_em_analise':
      return contratoComComprovanteEmAnalise(contrato)
    case 'aguardando_aceite':
      return contratoAguardandoAceite(contrato)
    case 'entrada_em_aberto':
      return contratoComEntradaEmAberto(contrato)
  }
}

export function filtrarContratosPorSituacao(
  contratos: Contrato[],
  situacao: ContratoSituacao,
): Contrato[] {
  if (situacao === 'todos') return contratos
  return contratos.filter((contrato) =>
    contratoPertenceSituacao(contrato, situacao),
  )
}

export interface ContagemSituacoesContrato {
  todos: number
  aguardando_aceite: number
  entrada_em_aberto: number
  comprovante_em_analise: number
}

export function contarSituacoesContrato(
  contratos: Contrato[],
): ContagemSituacoesContrato {
  const contagem: ContagemSituacoesContrato = {
    todos: contratos.length,
    aguardando_aceite: 0,
    entrada_em_aberto: 0,
    comprovante_em_analise: 0,
  }

  for (const contrato of contratos) {
    if (contratoComComprovanteEmAnalise(contrato)) {
      contagem.comprovante_em_analise += 1
    } else if (contratoAguardandoAceite(contrato)) {
      contagem.aguardando_aceite += 1
    } else if (contratoComEntradaEmAberto(contrato)) {
      contagem.entrada_em_aberto += 1
    }
  }

  return contagem
}
