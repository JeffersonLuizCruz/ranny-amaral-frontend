import { useState } from 'react'
import type { FormEvent } from 'react'
import { Camera } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass } from '@/shared/components/ui/Field'
import { PasswordInput } from '@/shared/components/ui/PasswordInput'
import { mensagemDeErro } from '@/shared/api/errors'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const status = useAuthStore((state) => state.status)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (status === 'authenticated') {
    const destino = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={destino} replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const sessao = await login(email, senha)
      navigate(sessao.deveTrocarSenha ? '/trocar-senha' : '/', { replace: true })
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Camera className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-ink">Photoizer CRM</h1>
            <p className="text-xs text-muted">Entre com sua conta do estúdio</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="E-mail" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="voce@estudio.com"
              required
            />
          </Field>

          <Field label="Senha" htmlFor="login-senha">
            <PasswordInput
              id="login-senha"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {erro ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200">
              {erro}
            </p>
          ) : null}

          <Button type="submit" fullWidth size="lg" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
