import type { Contrato } from '@/domain/contracts'

export function printContract(contrato: Contrato): void {
  if (typeof window === 'undefined') return

  const previousTitle = document.title
  document.title = `${contrato.numero} - ${contrato.snapshot.cliente.nome}`

  window.print()

  document.title = previousTitle
}
