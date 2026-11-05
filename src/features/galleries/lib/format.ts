export function formatDateLong(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
}
