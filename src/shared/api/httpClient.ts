import type { ApiErrorPayload } from './types'

const API_BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1')
  .replace(/\/+$/, '')

/**
 * Erro de transporte/negócio da API.
 *
 * Preserva o status HTTP, o código de negócio e os campos inválidos para que a
 * UI possa exibir uma mensagem útil sem depender do formato interno do backend.
 */
export class ApiError extends Error {
  readonly status: number
  readonly codigo: string
  readonly campos: NonNullable<ApiErrorPayload['campos']>

  constructor(payload: Partial<ApiErrorPayload> | null, status: number) {
    const campos = payload?.campos ?? []
    const detalhe = campos
      .map((campo) => `${campo.campo}: ${campo.mensagem}`)
      .join('; ')
    const mensagem =
      payload?.mensagem ??
      (status === 0 ? 'Não foi possível conectar ao servidor.' : 'Erro inesperado na API.')
    super(detalhe ? `${mensagem} (${detalhe})` : mensagem)
    this.name = 'ApiError'
    this.status = status
    this.codigo = payload?.codigo ?? (status === 0 ? 'SEM_CONEXAO' : 'ERRO_API')
    this.campos = campos
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError({ status: 0, codigo: 'SEM_CONEXAO', mensagem: 'Não foi possível conectar ao servidor.' }, 0)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const texto = await response.text()
  let corpo: unknown = null
  if (texto) {
    try {
      corpo = JSON.parse(texto)
    } catch {
      corpo = null
    }
  }

  if (!response.ok) {
    throw new ApiError(corpo as Partial<ApiErrorPayload> | null, response.status)
  }

  return corpo as T
}

/** URL absoluta/relativa para downloads diretos (ex.: ZIP streaming). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}
