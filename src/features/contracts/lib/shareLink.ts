import type { Contrato } from '@/domain/contracts'
import { acceptanceAdapter } from '@/integrations/acceptance'
import { useAcceptanceStore } from '@/features/contracts/store/acceptanceStore'
import { buildAcceptanceUrl } from '@/features/contracts/lib/acceptance'

export async function getContractLink(
  contrato: Contrato,
  expiresInDays = 7,
): Promise<string | null> {
  const solicitacoes = useAcceptanceStore
    .getState()
    .solicitacoes.filter((item) => item.contratoId === contrato.id)
    .sort(
      (a, b) =>
        new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime(),
    )

  const existing = solicitacoes.find((item) =>
    ['pendente', 'visualizada', 'aceita'].includes(item.status),
  )

  if (existing) return buildAcceptanceUrl(existing.token)
  if (contrato.statusAceite === 'cancelado') return null
  if (!['rascunho', 'expirado'].includes(contrato.statusAceite)) return null

  const solicitacao = await acceptanceAdapter.createLink(contrato.id, expiresInDays)
  return buildAcceptanceUrl(solicitacao.token)
}

export async function copyContractLink(
  contrato: Contrato,
  expiresInDays = 7,
): Promise<string | null> {
  const link = await getContractLink(contrato, expiresInDays)
  if (!link) return null

  try {
    await navigator.clipboard.writeText(link)
  } catch {
    window.prompt('Copie o link do contrato:', link)
  }

  return link
}
