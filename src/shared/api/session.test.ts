import { describe, expect, it, vi } from 'vitest'

import { session } from '@/shared/api/session'

describe('session', () => {
  it('deduplica chamadas de refresh concorrentes', async () => {
    let resolver: (valor: boolean) => void = () => undefined
    const handler = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolver = resolve
        }),
    )
    session.configure({ refresh: handler })

    const primeira = session.refresh()
    const segunda = session.refresh()

    expect(handler).toHaveBeenCalledTimes(1)
    resolver(true)
    await expect(primeira).resolves.toBe(true)
    await expect(segunda).resolves.toBe(true)
  })

  it('limpa o token e avisa quando a sessão é invalidada', () => {
    const unauthorized = vi.fn()
    session.configure({ unauthorized })
    session.setToken('token-antigo')

    session.unauthorized()

    expect(session.getToken()).toBeNull()
    expect(unauthorized).toHaveBeenCalledTimes(1)
  })
})
