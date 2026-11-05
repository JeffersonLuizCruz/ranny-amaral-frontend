import type {
  Contrato,
  DadosAceite,
  SolicitacaoAceite,
} from '@/domain/contracts'

export function isAcceptanceExpired(solicitacao: SolicitacaoAceite): boolean {
  if (solicitacao.status === 'aceita' || solicitacao.status === 'cancelada') return false
  return new Date(solicitacao.expiraEm).getTime() < Date.now()
}

export function buildAcceptanceUrl(token: string): string {
  if (typeof window === 'undefined') return `/assinar/${token}`
  return `${window.location.origin}/assinar/${token}`
}

export function acceptanceWhatsAppMessage(
  contrato: Contrato,
  token: string,
): string {
  const link = buildAcceptanceUrl(token)
  const nome = contrato.snapshot.cliente.nome.split(' ')[0] ?? contrato.snapshot.cliente.nome

  return `Olá, ${nome}! Segue o link para você revisar e aceitar o contrato ${contrato.numero}: ${link}`
}

export async function hashContractContent(
  contrato: Contrato,
  aceite: DadosAceite,
): Promise<string> {
  const payload = JSON.stringify({
    numero: contrato.numero,
    titulo: contrato.titulo,
    clausulas: contrato.clausulas,
    snapshot: contrato.snapshot,
    valorTotal: contrato.valorTotal,
    formaPagamento: contrato.formaPagamento,
    aceite,
  })

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return 'hash-indisponivel'
  }

  const data = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
