export type Role = 'admin' | 'gestor'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: Role
  ativo: boolean
  deveTrocarSenha: boolean
  ultimoLoginEm?: string
  createdAt: string
  updatedAt: string
}

export interface Sessao {
  accessToken: string
  expiresInSeconds: number
  usuario: Usuario
  deveTrocarSenha: boolean
}

export interface SenhaTemporaria {
  usuario: Usuario
  senhaTemporaria: string
}
