import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { formatBytes } from '@/shared/lib/bytes'

interface GalleryMediaRemoveDialogProps {
  open: boolean
  midias: MidiaGaleria[]
  lote?: boolean
  selecaoRascunho?: boolean
  removendo?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function GalleryMediaRemoveDialog({
  open,
  midias,
  lote = false,
  selecaoRascunho = false,
  removendo = false,
  onClose,
  onConfirm,
}: GalleryMediaRemoveDialogProps) {
  const [confirmacao, setConfirmacao] = useState('')
  const totalBytes = midias.reduce((total, midia) => total + (midia.tamanho ?? 0), 0)
  const video = midias.length === 1 && midias[0]?.tipo === 'video'
  const confirmado = !lote || confirmacao.trim().toUpperCase() === 'REMOVER'

  useEffect(() => {
    if (!open) setConfirmacao('')
  }, [open])

  if (!open) return null

  const titulo = lote
    ? 'Remover todas as fotos?'
    : `Remover ${video ? 'vídeo' : 'foto'}?`

  return (
    <Modal open={open} onClose={onClose} title={titulo}>
      <div className="space-y-4 text-sm text-ink">
        {lote ? (
          <p>
            <strong>{midias.length} foto(s)</strong> serão removidas
            {totalBytes > 0 ? ` (${formatBytes(totalBytes)})` : ''}.
          </p>
        ) : (
          <div className="rounded-xl border border-line bg-canvas/60 px-3 py-2">
            <p className="truncate font-medium">{midias[0]?.nomeArquivo ?? 'Mídia'}</p>
            <p className="mt-0.5 text-xs text-muted">
              {midias[0]?.tipo === 'video' ? 'Vídeo' : 'Foto'} ·{' '}
              {formatBytes(midias[0]?.tamanho)}
            </p>
          </div>
        )}

        <ul className="space-y-1.5 text-xs text-muted">
          <li>
            {lote || video
              ? '• Os arquivos serão apagados do armazenamento e não poderão ser recuperados.'
              : '• A foto sairá da galeria e não poderá ser restaurada pela interface.'}
          </li>
          {lote ? (
            <>
              <li>
                • As versões editadas e os derivados dessas fotos também serão apagados.
                Vídeos não serão afetados.
              </li>
              <li>• O número das fotos não será reutilizado.</li>
            </>
          ) : (
            <>
              {midias[0]?.editadaDisponivel ? (
                <li>• A versão editada e os derivados também serão apagados.</li>
              ) : null}
              <li>• O número desta mídia não será reutilizado.</li>
            </>
          )}
          {selecaoRascunho ? (
            <li>
              • A seleção reaberta do cliente será ajustada e ele precisará revisar as
              fotos escolhidas.
            </li>
          ) : null}
        </ul>

        {lote ? (
          <label className="block text-xs font-medium text-ink">
            Digite <span className="font-bold">REMOVER</span> para confirmar
            <input
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoComplete="off"
            />
          </label>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={removendo}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!confirmado || removendo || midias.length === 0}
          >
            {removendo ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {removendo ? 'Removendo…' : lote ? `Remover ${midias.length} foto(s)` : 'Remover'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
