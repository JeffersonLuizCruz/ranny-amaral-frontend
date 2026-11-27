import type { Contrato } from '@/domain/contracts'
import {
  contratoAguardandoAceite,
  contratoComEntradaEmAberto,
} from '@/domain/contractQueues'

export type LembreteContrato = 'aceite' | 'entrada'

/**
 * Define qual cobrança faz sentido para o contrato.
 *
 * Comprovante em análise fica de fora: nesse caso a próxima ação é do staff,
 * não do cliente.
 */
export function tipoLembreteContrato(
  contrato: Contrato,
): LembreteContrato | null {
  if (contratoAguardandoAceite(contrato)) return 'aceite'
  if (contratoComEntradaEmAberto(contrato)) return 'entrada'
  return null
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome
}

export function mensagemLembreteAceite(
  contrato: Contrato,
  link: string,
): string {
  return `Olá, ${primeiroNome(contrato.snapshot.cliente.nome)}! Segue o link para você revisar e aceitar o contrato ${contrato.numero}: ${link}`
}

export function mensagemLembreteEntrada(
  contrato: Contrato,
  link: string,
): string {
  const motivo = contrato.pagamento.rejeicao?.motivo

  if (motivo) {
    return `Olá, ${primeiroNome(contrato.snapshot.cliente.nome)}! O comprovante da entrada do contrato ${contrato.numero} foi recusado: ${motivo}. Envie um novo comprovante por aqui: ${link}`
  }

  return `Olá, ${primeiroNome(contrato.snapshot.cliente.nome)}! Falta confirmar a entrada do contrato ${contrato.numero}. Você pode enviar o comprovante por aqui: ${link}`
}

export function mensagemLembreteContrato(
  contrato: Contrato,
  link: string,
): string | null {
  switch (tipoLembreteContrato(contrato)) {
    case 'aceite':
      return mensagemLembreteAceite(contrato, link)
    case 'entrada':
      return mensagemLembreteEntrada(contrato, link)
    default:
      return null
  }
}
