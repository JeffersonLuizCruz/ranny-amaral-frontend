/** Campo inválido devolvido pelo backend no erro 422. */
export interface CampoErro {
  campo: string
  mensagem: string
}

/**
 * Formato único de erro da API (`ErrorResponse` do backend).
 *
 * `status` e `codigo` são preenchidos também para falhas de rede, com
 * `status = 0` e `codigo = "SEM_CONEXAO"`.
 */
export interface ApiErrorPayload {
  timestamp?: string
  status: number
  error?: string
  codigo: string
  mensagem: string
  caminho?: string
  campos?: CampoErro[]
}

/**
 * Envelope de paginação devolvido pelas listagens da API.
 *
 * `pagina` é 0-based; `totalPaginas` pode ser 0 quando não há itens.
 */
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
  temAnterior: boolean
  temProxima: boolean
}
