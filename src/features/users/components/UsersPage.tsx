import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Copy, KeyRound, Plus, ShieldCheck, UserRound } from 'lucide-react'

import {
  alterarAtivo,
  criarUsuario,
  listarUsuarios,
  resetarSenha,
} from '@/features/auth/api/authApi'
import type { Role, SenhaTemporaria, Usuario } from '@/features/auth/types'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, selectClass } from '@/shared/components/ui/Field'
import { useToastStore } from '@/shared/store/toastStore'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
}

export function UsersPage() {
  const addToast = useToastStore((state) => state.addToast)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('gestor')
  const [criando, setCriando] = useState(false)
  const [temporaria, setTemporaria] = useState<SenhaTemporaria | null>(null)

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      setUsuarios(await listarUsuarios())
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  const criar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCriando(true)
    setErro('')
    try {
      const resultado = await criarUsuario(nome, email, role)
      setTemporaria(resultado)
      setNome('')
      setEmail('')
      setRole('gestor')
      await carregar()
      addToast('Usuário criado. Entregue a senha temporária com segurança.')
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setCriando(false)
    }
  }

  const resetar = async (usuario: Usuario) => {
    if (!window.confirm(`Resetar a senha de ${usuario.nome}? As sessões abertas serão encerradas.`)) {
      return
    }
    try {
      setTemporaria(await resetarSenha(usuario.id))
      await carregar()
      addToast('Senha temporária gerada. Ela será exibida uma única vez.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const alternarAtivo = async (usuario: Usuario) => {
    try {
      await alterarAtivo(usuario.id, !usuario.ativo)
      await carregar()
      addToast(usuario.ativo ? 'Usuário desativado.' : 'Usuário ativado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const copiar = async (valor: string) => {
    try {
      await navigator.clipboard.writeText(valor)
      addToast('Senha temporária copiada.')
    } catch {
      addToast('Não foi possível copiar.')
    }
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Administração</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
            <ShieldCheck className="size-5 text-brand-600" />
            Usuários
          </h1>
          <p className="mt-1 text-xs text-muted">
            Crie acessos, resete senhas e ative/desative contas. Apenas administradores veem esta tela.
          </p>
        </div>

        {temporaria ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Senha temporária de {temporaria.usuario.nome}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-amber-200">
                {temporaria.senhaTemporaria}
              </code>
              <Button variant="secondary" size="sm" onClick={() => void copiar(temporaria.senhaTemporaria)}>
                <Copy className="size-3.5" />
                Copiar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTemporaria(null)}>
                Fechar
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-amber-800">
              Ela não será exibida novamente. O usuário será obrigado a trocar no primeiro acesso.
            </p>
          </div>
        ) : null}

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Plus className="size-4 text-brand-600" />
            Novo usuário
          </h2>
          <form onSubmit={criar} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
            <Field label="Nome" htmlFor="novo-nome">
              <input
                id="novo-nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className={inputClass}
                placeholder="Nome completo"
                required
              />
            </Field>
            <Field label="E-mail" htmlFor="novo-email">
              <input
                id="novo-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="pessoa@estudio.com"
                required
              />
            </Field>
            <Field label="Perfil" htmlFor="novo-role">
              <select
                id="novo-role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className={selectClass}
              >
                <option value="gestor">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            <Button type="submit" disabled={criando}>
              {criando ? 'Criando…' : 'Criar'}
            </Button>
          </form>
          {erro ? <p className="mt-2 text-xs font-medium text-red-600">{erro}</p> : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <UserRound className="size-4 text-brand-600" />
              Contas
            </h2>
            <span className="text-xs text-muted">{usuarios.length} usuário(s)</span>
          </div>

          {carregando ? (
            <p className="p-4 text-sm text-muted">Carregando…</p>
          ) : usuarios.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="divide-y divide-line">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {usuario.nome}
                      {!usuario.ativo ? (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          inativo
                        </span>
                      ) : null}
                      {usuario.deveTrocarSenha ? (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          troca pendente
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {usuario.email} · {ROLE_LABEL[usuario.role]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void resetar(usuario)}>
                      <KeyRound className="size-3.5" />
                      Resetar senha
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void alternarAtivo(usuario)}>
                      {usuario.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
