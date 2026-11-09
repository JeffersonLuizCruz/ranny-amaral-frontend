import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const inicializado = useAuthStore((state) => state.inicializado)
  const usuario = useAuthStore((state) => state.usuario)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const location = useLocation()

  useEffect(() => {
    if (!inicializado) void bootstrap()
  }, [bootstrap, inicializado])

  if (!inicializado || status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          Carregando sessão…
        </span>
      </div>
    )
  }

  if (status === 'anonymous' || !usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (usuario.deveTrocarSenha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const usuario = useAuthStore((state) => state.usuario)
  if (usuario?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}
