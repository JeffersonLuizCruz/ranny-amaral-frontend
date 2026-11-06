import { useRef, useState } from 'react'
import { CheckCircle2, ExternalLink, ImageUp, Loader2, Trash2 } from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { UploadProgress } from '@/shared/components/ui/UploadProgress'
import { useToastStore } from '@/shared/store/toastStore'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'
import { EDITED_ACCEPT, validateEditedFile } from '@/features/galleries/lib/mediaFile'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'

interface GalleryEditedVersionDialogProps {
  open: boolean
  onClose: () => void
  galeriaId: string
  midia: MidiaGaleria
}

/**
 * Envia a versao final editada de uma foto.
 *
 * <p>O upload usa o mesmo cliente com progresso real da midia original; a versao
 * substitui a anterior e gera novos derivados de entrega no backend.
 */
export function GalleryEditedVersionDialog({
  open,
  onClose,
  galeriaId,
  midia,
}: GalleryEditedVersionDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadVersaoEditada = useGalleryStore((state) => state.uploadVersaoEditada)
  const removeVersaoEditada = useGalleryStore((state) => state.removeVersaoEditada)
  const addToast = useToastStore((state) => state.addToast)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<UploadProgressValue>()
  const [uploading, setUploading] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  const selecionar = (selecionado: File | null) => {
    if (!selecionado) return
    const erro = validateEditedFile(selecionado)
    if (erro) {
      addToast(`${selecionado.name}: ${erro}`)
      return
    }
    setFile(selecionado)
  }

  const enviar = async () => {
    if (!file) return
    setUploading(true)
    setProgress(undefined)
    try {
      await uploadVersaoEditada(galeriaId, midia.id, file, { onProgress: setProgress })
      addToast('Versão editada enviada.')
      setFile(null)
      onClose()
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setUploading(false)
      setProgress(undefined)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remover = async () => {
    if (!window.confirm('Remover a versão editada desta foto?')) return
    setRemovendo(true)
    try {
      await removeVersaoEditada(galeriaId, midia.id)
      addToast('Versão editada removida.')
      onClose()
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Versão editada"
      description={midia.nomeArquivo}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/60 p-3">
          {midia.thumbUrl ? (
            <img
              src={midia.thumbUrl}
              alt={midia.nomeArquivo}
              className="size-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-100 text-muted">
              <ImageUp className="size-5" />
            </span>
          )}
          <div className="min-w-0 text-xs text-muted">
            <p className="truncate font-medium text-ink">{midia.nomeArquivo}</p>
            <p className="mt-0.5">
              {midia.editadaDisponivel
                ? 'Esta foto já possui uma versão editada.'
                : 'Envie a versão final em JPEG, PNG ou WebP (até 50 MB).'}
            </p>
            {midia.editadaUrl ? (
              <a
                href={midia.editadaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
              >
                <ExternalLink className="size-3" />
                Abrir versão atual
              </a>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={EDITED_ACCEPT}
          className="sr-only"
          onChange={(event) => selecionar(event.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
        >
          <ImageUp className="mx-auto size-6 text-brand-600" />
          <p className="mt-2 text-sm font-medium text-ink">
            {file ? file.name : 'Selecionar arquivo editado'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            JPEG, PNG ou WebP · até 50 MB
          </p>
        </button>

        {progress ? <UploadProgress progress={progress} /> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
          {midia.editadaDisponivel ? (
            <Button
              variant="ghost"
              onClick={() => void remover()}
              disabled={uploading || removendo}
            >
              {removendo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4 text-red-600" />
              )}
              Remover
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={() => void enviar()} disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {uploading ? 'Enviando…' : 'Enviar versão'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
