import type { Role, Sessao, SenhaTemporaria, Usuario } from '@/features/auth/types'
import { http } from '@/shared/api/httpClient'

interface SessaoDto {
  accessToken: string
  expiresInSeconds: number
  usuario: Usuario
  deveTrocarSenha: boolean
}

export async function login(email: string, senha: string): Promise<Sessao> {
  return http.post<SessaoDto>('/auth/login', { email, senha })
}

export async function refresh(): Promise<Sessao> {
  return http.post<SessaoDto>('/auth/refresh')
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

export async function me(): Promise<Usuario> {
  return http.get<Usuario>('/auth/me')
}

export async function changePassword(
  senhaAtual: string,
  novaSenha: string,
): Promise<Sessao> {
  return http.post<SessaoDto>('/auth/change-password', { senhaAtual, novaSenha })
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return http.get<Usuario[]>('/usuarios')
}

export async function criarUsuario(
  nome: string,
  email: string,
  role: Role,
): Promise<SenhaTemporaria> {
  return http.post<SenhaTemporaria>('/usuarios', { nome, email, role })
}

export async function resetarSenha(usuarioId: string): Promise<SenhaTemporaria> {
  return http.post<SenhaTemporaria>(`/usuarios/${usuarioId}/reset-password`)
}

export async function atualizarUsuario(
  usuarioId: string,
  nome: string,
  role: Role,
): Promise<Usuario> {
  return http.put<Usuario>(`/usuarios/${usuarioId}`, { nome, role })
}

export async function alterarAtivo(usuarioId: string, ativo: boolean): Promise<Usuario> {
  return http.patch<Usuario>(`/usuarios/${usuarioId}/ativo`, { ativo })
}
