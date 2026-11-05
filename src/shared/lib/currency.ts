const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRL(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0)
}

/**
 * Accepts both `1490.50` and `1.490,50` (and a few messy variations),
 * returning a safe number for the domain model.
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned) return 0

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  let normalized = cleaned
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
