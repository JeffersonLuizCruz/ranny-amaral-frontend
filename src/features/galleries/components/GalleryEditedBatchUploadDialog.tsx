import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ImageUp, Loader2, RotateCcw, X } from 'lucide-react'

import type { MidiaGaleria } from '@/domain/galleries'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { useToastStore } from '@/shared/store/toastStore'
import { EDITED_ACCEPT, validateEditedFile } from '@/features/galleries/lib/mediaFile'
import { formatarNumeroFoto } from '@/features/galleries/lib/format'
import {
  associarArquivosEditados,
  type UploadEditadaLoteItem,
  type UploadEditadaLoteProgresso,
} from '@/features/galleries/lib/editedBatch'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'

interface GalleryEditedBatchUploadDialogProps {
  open: boolean
  onClose: () => void
  galeriaId: string
  fotos: MidiaGaleria[]
}

type Progressos = Record<string, UploadEditadaLoteProgresso>

function chaveArquivo(arquivo: File): string {
  return `${arquivo.name}:${arquivo.size}:${arquivo.lastModified}`
}

/**
 * Envio em lote das versoes editadas.
 *
 * <p>O backend continua recebendo uma foto por vez pelo fluxo pre-assinado; o
 * lote apenas associa os arquivos pelo numero da foto (ou nome original), limita
 * a concorrencia e atualiza a galeria uma unica vez no final.
 */
export function GalleryEditedBatchUploadDialog({
  open,
  onClose,
  galeriaId,
  fotos,
}: GalleryEditedBatchUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadVersoesEditadas = useGalleryStore(
    (state) => state.uploadVersoesEditadas,
  )
  const addToast = useToastStore((state) => state.addToast)
  const [arquivos, setArquivos] = useState<File[]>([])
  const [progressos, setProgressos] = useState<Progressos>({})
  const [enviando, setEnviando] = useState(false)

  const associacao = useMemo(
    () => associarArquivosEditados(fotos, arquivos),
    [fotos, arquivos],
  )
  const itens: UploadEditadaLoteItem[] = associacao.correspondencias.map(
    ({ midia, arquivo }) => ({ midiaId: midia.id, file: arquivo }),
  )
  const total = itens.length
  const concluidos = itens.filter(
    (item) => progressos[item.midiaId]?.status === 'concluido',
  ).length
  const falhas = itens.filter(
    (item) => progressos[item.midiaId]?.status === 'erro',
  ).length

  const adicionarArquivos = (lista: FileList | null) => {
    if (!lista || lista.length === 0) return

    const validos: File[] = []
    let invalidos = 0
    for (const arquivo of Array.from(lista)) {
      const erro = validateEditedFile(arquivo)
      if (erro) {
        invalidos += 1
        addToast(`${arquivo.name}: ${erro}`)
        continue
      }
      validos.push(arquivo)
    }

    if (validos.length > 0) {
      setArquivos((atuais) => {
        const chaves = new Set(atuais.map(chaveArquivo))
        return [
          ...atuais,
          ...validos.filter((arquivo) => !chaves.has(chaveArquivo(arquivo))),
        ]
      })
    }
    setProgressos({})
    if (invalidos > 0) {
      addToast(`${invalidos} arquivo(s) ignorado(s) por formato ou tamanho.`)
    }
  }

  const removerArquivo = (arquivo: File) => {
    const chave = chaveArquivo(arquivo)
    setArquivos((atuais) => atuais.filter((item) => chaveArquivo(item) !== chave))
    setProgressos({})
  }

  const limpar = () => {
    setArquivos([])
    setProgressos({})
    if (inputRef.current) inputRef.current.value = ''
  }

  const executarUpload = async (itensParaEnviar: UploadEditadaLoteItem[]) => {
    if (itensParaEnviar.length === 0) return
    const existentesParaEnviar = itensParaEnviar.filter((item) => {
      const midia = fotos.find((foto) => foto.id === item.midiaId)
      return Boolean(midia?.editadaDisponivel)
    }).length
    if (existentesParaEnviar > 0) {
      const confirmado = window.confirm(
        `${existentesParaEnviar} foto(s) já possuem versão editada e serão substituídas. Continuar?`,
      )
      if (!confirmado) return
    }

    setEnviando(true)
    setProgressos((atuais) => {
      const proximos = { ...atuais }
      for (const item of itensParaEnviar) {
        proximos[item.midiaId] = { status: 'aguardando', percentual: 0 }
      }
      return proximos
    })

    try {
      const resultados = await uploadVersoesEditadas(
        galeriaId,
        itensParaEnviar,
        (midiaId, progresso) => {
          setProgressos((atuais) => ({ ...atuais, [midiaId]: progresso }))
        },
      )
      const sucessos = resultados.filter((resultado) => resultado.ok).length
      const falhasResultado = resultados.length - sucessos
      addToast(
        falhasResultado === 0
          ? `${sucessos} versão(ões) editada(s) enviada(s).`
          : `${sucessos} enviada(s) e ${falhasResultado} com falha.`,
      )
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  const enviar = () => void executarUpload(itens)

  const tentarNovamente = () => {
    const falhos = itens.filter(
      (item) => progressos[item.midiaId]?.status === 'erro',
    )
    void executarUpload(falhos)
  }

  const fechar = () => {
    if (!enviando) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Enviar versões editadas em lote"
      description="Associamos cada arquivo pelo número da foto ou pelo nome original."
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={EDITED_ACCEPT}
          className="sr-only"
          disabled={enviando}
          onChange={(event) => adicionarArquivos(event.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/30 disabled:opacity-60"
        >
          <ImageUp className="mx-auto size-6 text-brand-600" />
          <p className="mt-2 text-sm font-medium text-ink">
            {arquivos.length > 0
              ? `${arquivos.length} arquivo(s) selecionado(s)`
              : 'Selecionar arquivos editados'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            JPEG, PNG ou WebP · até 50 MB por foto · envio de várias fotos
          </p>
        </button>

        {arquivos.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Resumo rotulo="Prontos" valor={total} tom="ok" />
              <Resumo
                rotulo="Sem arquivo"
                valor={associacao.fotosSemArquivo.length}
                tom={associacao.fotosSemArquivo.length > 0 ? 'alerta' : 'neutro'}
              />
              <Resumo
                rotulo="Sem correspondência"
                valor={associacao.semCorrespondencia.length}
                tom={associacao.semCorrespondencia.length > 0 ? 'alerta' : 'neutro'}
              />
              <Resumo
                rotulo="Duplicados"
                valor={associacao.duplicados.length}
                tom={associacao.duplicados.length > 0 ? 'erro' : 'neutro'}
              />
            </div>

            {associacao.duplicados.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-[11px] text-red-700">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-3.5" />
                  Mais de um arquivo para a mesma foto
                </p>
                <p className="mt-1">
                  Remova o arquivo indesejado para liberar o envio.
                </p>
                <div className="mt-2 space-y-1">
                  {associacao.duplicados.map(({ midia, arquivos: lista }) => (
                    <div key={midia.id}>
                      <p className="font-medium text-ink">
                        {formatarNumeroFoto(midia.numero)} · {midia.nomeArquivo}
                      </p>
                      {lista.map((arquivo) => (
                        <LinhaArquivo
                          key={chaveArquivo(arquivo)}
                          arquivo={arquivo}
                          onRemove={() => removerArquivo(arquivo)}
                          disabled={enviando}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {associacao.semCorrespondencia.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-800">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-3.5" />
                  Arquivos sem foto correspondente
                </p>
                <div className="mt-2 space-y-1">
                  {associacao.semCorrespondencia.map((arquivo) => (
                    <LinhaArquivo
                      key={chaveArquivo(arquivo)}
                      arquivo={arquivo}
                      onRemove={() => removerArquivo(arquivo)}
                      disabled={enviando}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {associacao.fotosSemArquivo.length > 0 ? (
              <p className="rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted">
                <span className="font-medium text-ink">Fotos sem arquivo:</span>{' '}
                {associacao.fotosSemArquivo
                  .map((foto) => formatarNumeroFoto(foto.numero))
                  .join(', ')}
              </p>
            ) : null}

            <div className="space-y-2">
              {associacao.correspondencias.map(({ midia, arquivo }) => {
                const progresso = progressos[midia.id]
                return (
                  <div
                    key={midia.id}
                    className="rounded-xl border border-line bg-canvas/60 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      {midia.thumbUrl ? (
                        <img
                          src={midia.thumbUrl}
                          alt={midia.nomeArquivo}
                          className="size-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-muted">
                          <ImageUp className="size-4" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-ink">
                          {formatarNumeroFoto(midia.numero)} · {midia.nomeArquivo}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {arquivo.name}
                        </p>
                        {midia.editadaDisponivel ? (
                          <p className="mt-0.5 text-[10px] text-amber-700">
                            Substituirá a versão editada atual.
                          </p>
                        ) : null}
                      </div>
                      <StatusItem progresso={progresso} />
                      {!enviando ? (
                        <button
                          type="button"
                          onClick={() => removerArquivo(arquivo)}
                          className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink"
                          aria-label={`Remover ${arquivo.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    {progresso?.status === 'enviando' ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-brand-600 transition-all"
                          style={{ width: `${progresso.percentual}%` }}
                        />
                      </div>
                    ) : null}
                    {progresso?.erro ? (
                      <p className="mt-1 text-[10px] text-red-600">{progresso.erro}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-muted">
            Selecione os arquivos editados. O padrão do ZIP de seleção
            (<strong className="text-ink">001_nome.jpg</strong>) é reconhecido
            automaticamente, assim como o nome original da foto.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
          {arquivos.length > 0 && !enviando ? (
            <Button variant="ghost" onClick={limpar}>
              Limpar
            </Button>
          ) : null}
          {falhas > 0 && !enviando ? (
            <Button variant="secondary" onClick={tentarNovamente}>
              <RotateCcw className="size-4" />
              Tentar novamente ({falhas})
            </Button>
          ) : null}
          <Button variant="secondary" onClick={fechar} disabled={enviando}>
            Fechar
          </Button>
          <Button onClick={enviar} disabled={total === 0 || enviando}>
            {enviando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {enviando
              ? `Enviando ${concluidos}/${total}…`
              : `Enviar ${total} arquivo(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Resumo({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string
  valor: number
  tom: 'neutro' | 'ok' | 'alerta' | 'erro'
}) {
  const cor =
    tom === 'ok'
      ? 'text-emerald-700'
      : tom === 'alerta'
        ? 'text-amber-700'
        : tom === 'erro'
          ? 'text-red-600'
          : 'text-ink'
  return (
    <div className="rounded-xl bg-canvas/70 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted">{rotulo}</p>
      <p className={`mt-0.5 text-sm font-semibold ${cor}`}>{valor}</p>
    </div>
  )
}

function StatusItem({
  progresso,
}: {
  progresso?: UploadEditadaLoteProgresso
}) {
  if (!progresso || progresso.status === 'aguardando') {
    return <span className="shrink-0 text-[10px] text-muted">Aguardando</span>
  }
  if (progresso.status === 'enviando') {
    return (
      <span className="shrink-0 text-[10px] font-medium text-brand-700">
        Enviando {progresso.percentual}%
      </span>
    )
  }
  if (progresso.status === 'concluido') {
    return (
      <span className="shrink-0 text-[10px] font-medium text-emerald-700">
        Concluído
      </span>
    )
  }
  return <span className="shrink-0 text-[10px] font-medium text-red-600">Erro</span>
}

function LinhaArquivo({
  arquivo,
  onRemove,
  disabled,
}: {
  arquivo: File
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-[11px]">{arquivo.name}</span>
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          className="grid size-5 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink"
          aria-label={`Remover ${arquivo.name}`}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  )
}
