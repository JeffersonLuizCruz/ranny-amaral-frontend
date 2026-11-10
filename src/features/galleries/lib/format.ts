export function formatDateLong(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
}

export function formatDateTime(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

/** Numero da foto no grid, com tres digitos para ordenar e casar com o ZIP. */
export function formatarNumeroFoto(numero: number): string {
  return String(numero).padStart(3, '0')
}
