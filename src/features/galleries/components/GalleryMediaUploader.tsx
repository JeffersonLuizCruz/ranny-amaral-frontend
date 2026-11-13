import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

import type { MidiaFinalidade } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { UploadProgress } from '@/shared/components/ui/UploadProgress'
import { useToastStore } from '@/shared/store/toastStore'
import type { UploadProgress as UploadProgressValue } from '@/shared/upload/types'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import {
  MEDIA_ACCEPT,
  mediaTipoFromFile,
  validateMediaFile,
} from '@/features/galleries/lib/mediaFile'

interface GalleryMediaUploaderProps {
  galleryId: string
  label?: string
  finalidade?: MidiaFinalidade
}

export function GalleryMediaUploader({
  galleryId,
  label,
  finalidade = 'edicao',
}: GalleryMediaUploaderProps) {
  const uploadMidia = useGalleryStore((state) => state.uploadMidia)
  const addToast = useToastStore((state) => state.addToast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [currentName, setCurrentName] = useState('')
  const [progress, setProgress] = useState<UploadProgressValue>()

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

        const tipo = mediaTipoFromFile(file)
        if (finalidade === 'pronta' && tipo === 'video') {
          addToast(`${file.name}: vídeos não entram como foto pronta.`)
          continue
        }

        setCurrentName(file.name)
        setProgress(undefined)
        await uploadMidia(galleryId, file, tipo, finalidade, {
          onProgress: setProgress,
        })
        enviados += 1
      }

      if (enviados > 0) {
        addToast(`${enviados} mídia(s) enviada(s) e processada(s).`)
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Não foi possível enviar as mídias.',
      )
    } finally {
      setUploading(false)
      setCurrentName('')
      setProgress(undefined)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        multiple
        className="hidden"
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
        {uploading ? currentName || 'Enviando…' : label ?? 'Enviar mídias'}
      </Button>

      {progress ? <UploadProgress progress={progress} /> : null}
    </div>
  )
}
