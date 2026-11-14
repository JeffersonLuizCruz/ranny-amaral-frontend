import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Field } from '@/shared/components/ui/Field'
import { PasswordInput } from '@/shared/components/ui/PasswordInput'
import { mensagemDeErro } from '@/shared/api/errors'

export function ChangePasswordPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const changePassword = useAuthStore((state) => state.changePassword)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErro('')
    if (nova.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (nova !== confirmacao) {
      setErro('A confirmação não confere com a nova senha.')
      return
    }
    setEnviando(true)
    try {
      await changePassword(atual, nova)
      navigate('/', { replace: true })
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-ink">Troque sua senha</h1>
            <p className="text-xs text-muted">
              {usuario?.email ?? 'Primeiro acesso'} · obrigatório antes de continuar
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Senha atual" htmlFor="senha-atual">
            <PasswordInput
              id="senha-atual"
              autoComplete="current-password"
              value={atual}
              onChange={(event) => setAtual(event.target.value)}
              required
            />
          </Field>

          <Field label="Nova senha" htmlFor="senha-nova" hint="Mínimo de 8 caracteres.">
            <PasswordInput
              id="senha-nova"
              autoComplete="new-password"
              value={nova}
              onChange={(event) => setNova(event.target.value)}
              required
            />
          </Field>

          <Field label="Confirmar nova senha" htmlFor="senha-confirmacao">
            <PasswordInput
              id="senha-confirmacao"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              required
            />
          </Field>

          {erro ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200">
              {erro}
            </p>
          ) : null}

          <Button type="submit" fullWidth size="lg" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full text-center text-xs font-medium text-muted hover:text-ink"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
