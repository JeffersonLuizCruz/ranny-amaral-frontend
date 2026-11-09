/**
 * Sessão em memória.
 *
 * O access token nunca vai para localStorage. O refresh fica em cookie
 * HttpOnly emitido pelo backend; ao recarregar a página o app chama /auth/refresh.
 */
let accessToken: string | null = null
let refreshHandler: (() => Promise<boolean>) | null = null
let unauthorizedHandler: (() => void) | null = null
let refreshEmAndamento: Promise<boolean> | null = null

export const session = {
  getToken(): string | null {
    return accessToken
  },

  setToken(token: string | null) {
    accessToken = token
  },

  configure(handlers: {
    refresh?: () => Promise<boolean>
    unauthorized?: () => void
  }) {
    refreshHandler = handlers.refresh ?? null
    unauthorizedHandler = handlers.unauthorized ?? null
  },

  async refresh(): Promise<boolean> {
    if (!refreshHandler) return false
    if (refreshEmAndamento) return refreshEmAndamento
    refreshEmAndamento = refreshHandler().finally(() => {
      refreshEmAndamento = null
    })
    return refreshEmAndamento
  },

  unauthorized() {
    accessToken = null
    unauthorizedHandler?.()
  },
}
