import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

import {
  detalharArmazenamentoGaleria,
  solicitarExpurgo,
  type DetalheArmazenamentoGaleria,
} from '@/features/storage/api/armazenamentoApi'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { formatBytes } from '@/shared/lib/bytes'
import { useToastStore } from '@/shared/store/toastStore'

interface ExpurgoDialogProps {
  galeriaId: string
  onClose: () => void
  onConcluido: () => void
}

/**
 * Previa e confirmacao do expurgo.
 *
 * O ADMIN precisa digitar o nome do cliente; o backend valida a mesma string.
 */
export function ExpurgoDialog({ galeriaId, onClose, onConcluido }: ExpurgoDialogProps) {
  const addToast = useToastStore((state) => state.addToast)
  const [detalhe, setDetalhe] = useState<DetalheArmazenamentoGaleria | null>(null)
  const [confirmacao, setConfirmacao] = useState('')
  const [motivo, setMotivo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    detalharArmazenamentoGaleria(galeriaId)
      .then((resposta) => {
        if (ativo) setDetalhe(resposta)
      })
      .catch((error) => {
        if (ativo) setErro(mensagemDeErro(error))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [galeriaId])

  const podeConfirmar =
    Boolean(detalhe?.elegivel) &&
    motivo.trim().length > 0 &&
    confirmacao.trim().toLowerCase() ===
      (detalhe?.confirmacaoEsperada ?? '').trim().toLowerCase()

  const confirmar = async () => {
    if (!detalhe || !podeConfirmar) return
    setEnviando(true)
    setErro(null)
    try {
      await solicitarExpurgo(galeriaId, motivo.trim(), confirmacao.trim())
      addToast('Expurgo agendado. Os binários serão removidos em instantes.')
      onConcluido()
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Expurgar binários da galeria"
      description="Metadados, histórico, financeiro e comprovantes são preservados."
    >
      {carregando ? (
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <Loader2 className="size-4 animate-spin" />
          Calculando o espaço ocupado…
        </p>
      ) : detalhe ? (
        <div className="space-y-3 text-[11px] text-muted">
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-4" />
              Ação irreversível
            </p>
            <p className="mt-1">
              O link do cliente será revogado e as fotos, vídeos e derivados serão
              removidos do storage. Não há backup.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas/60 p-3">
            <p className="text-ink">
              <strong>{detalhe.clienteNome ?? detalhe.galeriaId}</strong> ·{' '}
              {formatBytes(detalhe.totalBytes)} em {detalhe.quantidadeArquivos}{' '}
              arquivo(s).
            </p>
            <ul className="mt-1 space-y-0.5">
              {detalhe.grupos.map((grupo) => (
                <li key={grupo.finalidade}>
                  {grupo.finalidade}: {formatBytes(grupo.bytes)} ({grupo.quantidade})
                </li>
              ))}
            </ul>
          </div>

          {!detalhe.elegivel ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-200">
              {detalhe.motivoBloqueio ?? 'A galeria não está elegível para expurgo.'}
            </p>
          ) : null}

          <label className="block">
            <span className="text-ink">Motivo</span>
            <input
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              maxLength={500}
              placeholder="Ex.: cliente concluiu o download do ZIP"
              className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-ink">
              Digite <strong>{detalhe.confirmacaoEsperada}</strong> para confirmar
            </span>
            <input
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              maxLength={160}
              data-autofocus
              className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-500"
            />
          </label>

          {erro ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-red-800 ring-1 ring-red-200">
              {erro}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!podeConfirmar || enviando}
              onClick={() => void confirmar()}
            >
              {enviando ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Expurgar binários
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-800 ring-1 ring-red-200">
          {erro ?? 'Não foi possível carregar os dados da galeria.'}
        </p>
      )}
    </Modal>
  )
}
