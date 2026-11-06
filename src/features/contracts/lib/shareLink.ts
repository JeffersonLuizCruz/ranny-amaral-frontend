import type { Contrato } from '@/domain/contracts'
import { acceptanceAdapter } from '@/integrations/acceptance'
import { listarLinks } from '@/features/contracts/api/contratosApi'
import { buildAcceptanceUrl } from '@/features/contracts/lib/acceptance'

export async function getContractLink(
  contrato: Contrato,
  expiresInDays = 7,
): Promise<string | null> {
  const links = await listarLinks(contrato.id)
  const existente = links.find((item) =>
    ['pendente', 'visualizada', 'aceita'].includes(item.status),
  )

  if (existente) return buildAcceptanceUrl(existente.token)
  if (contrato.statusAceite === 'cancelado') return null
  if (!['rascunho', 'expirado', 'pendente'].includes(contrato.statusAceite)) return null

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
