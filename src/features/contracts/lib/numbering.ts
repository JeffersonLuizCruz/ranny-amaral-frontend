import type { Contrato, SolicitacaoAceite } from '@/domain/contracts'

export function nextContractNumber(
  contratos: Contrato[],
  year = new Date().getFullYear(),
): string {
  const prefix = `CT-${year}-`
  const highest = contratos.reduce((max, contrato) => {
    if (!contrato.numero.startsWith(prefix)) return max
    const sequence = Number.parseInt(contrato.numero.slice(prefix.length), 10)
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max
  }, 0)

  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}

export function nextAcceptanceProtocol(
  solicitacoes: SolicitacaoAceite[],
  year = new Date().getFullYear(),
): string {
  const prefix = `ACE-${year}-`
  const highest = solicitacoes.reduce((max, solicitacao) => {
    const protocolo = solicitacao.dadosAceite?.protocolo
    if (!protocolo?.startsWith(prefix)) return max
    const sequence = Number.parseInt(protocolo.slice(prefix.length), 10)
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max
  }, 0)

  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}
