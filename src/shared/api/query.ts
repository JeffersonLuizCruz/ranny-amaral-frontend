/**
 * Monta query string ignorando valores vazios.
 *
 * Centraliza a codificação para que as APIs não repitam `URLSearchParams` e
 * para que `undefined`, `null` e string vazia não virem `?q=`.
 */
export function toQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams()

  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue
    search.set(chave, String(valor))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}
