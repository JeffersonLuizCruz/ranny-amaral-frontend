import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Download, Images, Lock } from 'lucide-react'
import { useParams } from 'react-router-dom'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { useGalleryCrossTabSync } from '@/features/galleries/hooks/useGalleryCrossTabSync'
import { GalleryMediaGrid } from '@/features/galleries/components/GalleryMediaGrid'
import { entregaDisponivel, entregaExpirada } from '@/features/galleries/lib/selection'
import { getGalleryMedia } from '@/integrations/gallery/mediaStorage'
import { formatDateLong } from '@/features/galleries/lib/format'

export function PublicDeliveryPage() {
  const { token = '' } = useParams()
  useGalleryCrossTabSync()
  const galerias = useGalleryStore((state) => state.galerias)
  const registerDownload = useGalleryStore((state) => state.registerDownload)
  const appointments = useAppointmentStore((state) => state.appointments)
  const pacotes = usePackageStore((state) => state.pacotes)
  const clientes = useClientStore((state) => state.clientes)
  const estudio = useStudioStore((state) => state.estudio)
  const [mensagem, setMensagem] = useState('')
  const [baixando, setBaixando] = useState(false)

  const galeria = galerias.find((item) => item.entrega?.token === token)
  const appointment = galeria
    ? appointments.find((item) => item.id === galeria.agendamentoId)
    : undefined
  const pacote = appointment
    ? pacotes.find((item) => item.id === appointment.pacoteId)
    : undefined
  const cliente = appointment?.clienteId
    ? clientes.find((item) => item.id === appointment.clienteId)
    : undefined
  const nome = cliente?.nome ?? appointment?.contato?.nome ?? 'Cliente'

  const disponivel = galeria ? entregaDisponivel(galeria) : false
  const expirada = galeria ? entregaExpirada(galeria) : false
  const editadas = galeria
    ? galeria.midias.filter((midia) => midia.status === 'editada')
    : []

  const downloadMidia = async (midia: MidiaGaleria) => {
    try {
      const blob = await getGalleryMedia(midia.arquivoKey)
      if (!blob) {
        setMensagem(`Arquivo ${midia.nomeArquivo} não encontrado neste navegador.`)
        return false
      }

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = midia.nomeArquivo
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_500)
      return true
    } catch {
      setMensagem(`Não foi possível baixar ${midia.nomeArquivo}.`)
      return false
    }
  }

  const handleDownload = async (midia: MidiaGaleria) => {
    setMensagem('')
    const ok = await downloadMidia(midia)
    if (ok) registerDownload(token, 1)
  }

  const handleDownloadAll = async () => {
    setMensagem('')
    setBaixando(true)
    let total = 0

    try {
      for (const midia of editadas) {
        const ok = await downloadMidia(midia)
        if (ok) total += 1
      }
      if (total > 0) {
        registerDownload(token, total)
        setMensagem(`${total} arquivo(s) baixado(s).`)
      }
    } finally {
      setBaixando(false)
    }
  }

  if (!galeria) {
    return (
      <PublicShell studioName={estudio.nome}>
        <StatusCard
          tone="red"
          title="Link de entrega inválido"
          description="Não encontramos esta entrega. Solicite um novo link ao estúdio."
        />
      </PublicShell>
    )
  }

  if (!disponivel) {
    return (
      <PublicShell studioName={estudio.nome}>
        <StatusCard
          tone="amber"
          title={expirada ? 'Link de entrega expirado' : 'Entrega indisponível'}
          description={
            expirada
              ? `Este link expirou em ${formatDateLong(galeria.entrega?.expiraEm)}. Fale com o estúdio para reabrir o acesso.`
              : 'O estúdio revogou ou ainda não publicou este link de entrega.'
          }
        />
      </PublicShell>
    )
  }

  return (
    <PublicShell studioName={estudio.nome}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Sua entrega
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{nome}</h1>
          <p className="mt-0.5 text-xs text-muted">
            {pacote?.nome ?? 'Pacote'} · {editadas.length} arquivo(s) editado(s)
          </p>
        </div>

        {editadas.length > 0 ? (
          <Button onClick={handleDownloadAll} disabled={baixando}>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Images className="size-4 text-brand-600" />
            Arquivos editados
          </h2>
          <p className="text-[11px] text-muted">
            Disponível até {formatDateLong(galeria.entrega?.expiraEm)}
          </p>
        </div>

        <div className="mt-3">
          <GalleryMediaGrid
            midias={editadas}
            onDownload={handleDownload}
            emptyLabel="Nenhum arquivo editado disponível."
          />
        </div>
      </section>

      <footer className="mt-8 pb-6 text-center text-[10px] text-muted">
        {estudio.nome} · Link privado de entrega · Downloads registrados para o estúdio.
      </footer>
    </PublicShell>
  )
}

function PublicShell({
  children,
  studioName,
}: {
  children: ReactNode
  studioName?: string
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {studioName ?? 'Photoizer Estúdio'}
            </p>
            <p className="text-[11px] text-muted">Entrega de fotos e vídeos</p>
          </div>
          <span className="ml-auto hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
            <Lock className="size-3" />
            Link privado
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

function StatusCard({
  tone,
  title,
  description,
}: {
  tone: 'amber' | 'red'
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      <span
        className={
          tone === 'amber'
            ? 'mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700'
            : 'mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700'
        }
      >
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-3 text-base font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  )
}
