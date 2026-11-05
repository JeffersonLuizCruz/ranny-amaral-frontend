import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { useToastStore } from '@/shared/store/toastStore'
import { createId } from '@/shared/lib/id'
import {
  mediaTipoFromFile,
  saveGalleryMedia,
  validateMediaFile,
} from '@/integrations/gallery/mediaStorage'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'

interface GalleryMediaUploaderProps {
  galleryId: string
  edited?: boolean
  label?: string
}

export function GalleryMediaUploader({
  galleryId,
  edited = false,
  label,
}: GalleryMediaUploaderProps) {
  const addMedia = useGalleryStore((state) => state.addMedia)
  const addEditedMedia = useGalleryStore((state) => state.addEditedMedia)
  const addToast = useToastStore((state) => state.addToast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    let enviados = 0

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const erro = validateMediaFile(file)
        if (erro) {
          addToast(`${file.name}: ${erro}`)
          continue
        }

        setProgress(`Enviando ${index + 1} de ${files.length}…`)
        const stored = await saveGalleryMedia(file)
        const midia: MidiaGaleria = {
          id: createId('mid'),
          tipo: mediaTipoFromFile(file),
          nomeArquivo: stored.nomeArquivo,
          mimeType: stored.mimeType,
          tamanho: stored.tamanho,
          arquivoKey: stored.arquivoKey,
          status: edited ? 'editada' : 'original',
          uploadedAt: stored.enviadoEm,
        }

        if (edited) addEditedMedia(galleryId, midia)
        else addMedia(galleryId, midia)
        enviados += 1
      }

      if (enviados > 0) {
        addToast(
          edited
            ? `${enviados} arquivo(s) editado(s) enviado(s).`
            : `${enviados} mídia(s) enviada(s).`,
        )
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Não foi possível enviar as mídias.',
      )
    } finally {
      setUploading(false)
      setProgress('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {uploading ? progress || 'Enviando…' : label ?? 'Enviar mídias'}
      </Button>

      <p className="mt-1.5 text-[10px] text-muted">
        Fotos até 30 MB e vídeos até 500 MB. Os arquivos ficam salvos neste navegador
        (mock local).
      </p>
    </div>
  )
}
