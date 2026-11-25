import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { uploadMidia, addToast } = vi.hoisted(() => ({
  uploadMidia: vi.fn(),
  addToast: vi.fn(),
}))

vi.mock('@/features/galleries/store/galleryStore', () => ({
  useGalleryStore: (selector: (state: { uploadMidia: typeof uploadMidia }) => unknown) =>
    selector({ uploadMidia }),
}))

vi.mock('@/shared/store/toastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToast }) => unknown) =>
    selector({ addToast }),
}))

import { GalleryMediaUploader } from '@/features/galleries/components/GalleryMediaUploader'

function selecionarArquivo(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

describe('GalleryMediaUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadMidia.mockResolvedValue({})
  })

  it('envia vídeo com finalidade de edição no botão de vídeo', async () => {
    const { container } = render(
      <GalleryMediaUploader
        galleryId="g1"
        label="Enviar vídeo"
        tipo="video"
        finalidade="edicao"
      />,
    )
    const video = new File(['video'], 'video.mp4', { type: 'video/mp4' })

    selecionarArquivo(container, video)

    await waitFor(() =>
      expect(uploadMidia).toHaveBeenCalledWith(
        'g1',
        video,
        'video',
        'edicao',
        expect.objectContaining({ onProgress: expect.any(Function) }),
      ),
    )
  })

  it('rejeita vídeo no botão de fotos', async () => {
    const { container } = render(
      <GalleryMediaUploader galleryId="g1" label="Enviar fotos" tipo="foto" />,
    )
    const video = new File(['video'], 'video.mp4', { type: 'video/mp4' })

    selecionarArquivo(container, video)

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        'video.mp4: Envie fotos JPEG, PNG ou WebP.',
      ),
    )
    expect(uploadMidia).not.toHaveBeenCalled()
  })

  it('rejeita foto no botão de vídeo', async () => {
    const { container } = render(
      <GalleryMediaUploader galleryId="g1" label="Enviar vídeo" tipo="video" />,
    )
    const foto = new File(['foto'], 'foto.jpg', { type: 'image/jpeg' })

    selecionarArquivo(container, foto)

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        'foto.jpg: Envie vídeos MP4 ou MOV.',
      ),
    )
    expect(uploadMidia).not.toHaveBeenCalled()
  })

  it('mantém o botão desabilitado quando o envio está bloqueado', () => {
    render(
      <GalleryMediaUploader galleryId="g1" label="Enviar vídeo" disabled />,
    )

    expect(screen.getByRole('button', { name: 'Enviar vídeo' })).toBeDisabled()
  })
})
