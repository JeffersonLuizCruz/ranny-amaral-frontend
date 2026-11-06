import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Download, Images, Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { mensagemDeErro } from '@/shared/api/errors'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import {
  baixarMidiaPublica,
  consultarGaleriaPublica,
} from '@/features/galleries/api/galeriasApi'

interface PublicDeliveryData {
  clienteNome?: string
  midias: MidiaGaleria[]
  expiraEm?: string
  disponivel: boolean
}

function formatDate(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value))
}

export function PublicDeliveryPage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicDeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [baixando, setBaixando] = useState(false)

  useEffect(() => {
    let ativo = true
    consultarGaleriaPublica(token)
      .then((resultado) => {
        if (!ativo) return
        setData({
          clienteNome: resultado.galeria.clienteNome,
          midias: resultado.midias,
          expiraEm: resultado.link.expiraEm,
          disponivel: resultado.entregaDisponivel,
        })
      })
      .catch((error) => {
        if (ativo) setErro(mensagemDeErro(error))
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [token])

  const baixar = async (midia: MidiaGaleria) => {
    try {
      const { url } = await baixarMidiaPublica(token, midia.id)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = midia.nomeArquivo
      anchor.target = '_blank'
      anchor.rel = 'noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      return true
    } catch (error) {
      setMensagem(mensagemDeErro(error))
      return false
    }
  }

  const baixarTodos = async () => {
    if (!data) return
    setMensagem('')
    setBaixando(true)
    let total = 0
    try {
      for (const midia of data.midias) {
        if (await baixar(midia)) total += 1
      }
      if (total > 0) setMensagem(`${total} arquivo(s) baixado(s).`)
    } finally {
      setBaixando(false)
    }
  }

  if (loading) {
    return (
      <PublicShell>
        <div className="grid min-h-[50dvh] place-items-center">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Carregando entrega…
          </span>
        </div>
      </PublicShell>
    )
  }

  if (erro || !data?.disponivel) {
    return (
      <PublicShell>
        <StatusCard
          title="Entrega indisponível"
          description={erro || 'O link expirou, foi revogado ou ainda não foi publicado.'}
        />
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Sua entrega
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {data.clienteNome ?? 'Galeria'}
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {data.midias.length} arquivo(s) · disponível até {formatDate(data.expiraEm)}
          </p>
        </div>
        {data.midias.length > 0 ? (
          <Button onClick={() => void baixarTodos()} disabled={baixando}>
            <Download className="size-4" />
            {baixando ? 'Baixando…' : 'Baixar todos'}
          </Button>
        ) : null}
      </div>

      {mensagem ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
          {mensagem}
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Images className="size-4 text-brand-600" />
          Arquivos editados
        </h2>
        <div className="mt-3">
          <GalleryMediaGrid
            midias={data.midias}
            onDownload={(midia) => void baixar(midia)}
            emptyLabel="Nenhum arquivo disponível."
          />
        </div>
      </section>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-ink">Photoizer CRM</p>
        <p className="text-[11px] text-muted">Entrega de galeria</p>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

function StatusCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      <AlertTriangle className="mx-auto size-7 text-amber-600" />
      <h1 className="mt-2 text-base font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  )
}
