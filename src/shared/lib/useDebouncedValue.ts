import { useEffect, useState } from 'react'

/**
 * Atrasa a propagação de um valor.
 *
 * Usado nas buscas server-side para não disparar uma requisição a cada tecla.
 */
export function useDebouncedValue<T>(valor: T, atrasoMs = 300): T {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(valor), atrasoMs)
    return () => window.clearTimeout(timer)
  }, [atrasoMs, valor])

  return debounced
}
