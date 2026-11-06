import type { UploadOptions, UploadProgress, UploadSession, UploadedPart } from './types'

const CONCORRENCIA_PARTES = 3

function progresso(
  fase: UploadProgress['fase'],
  enviado: number,
  total: number,
  inicio: number,
): UploadProgress {
  const percentual = total > 0 ? Math.min(100, Math.round((enviado / total) * 100)) : 0
  const decorridoSegundos = Math.max((performance.now() - inicio) / 1000, 0.001)
  const velocidadeBps = enviado / decorridoSegundos
  const restante = velocidadeBps > 0 ? Math.ceil((total - enviado) / velocidadeBps) : undefined
  return { fase, enviado, total, percentual, velocidadeBps, restanteSegundos: restante }
}

/** Envia um blob para uma URL pre-assinada, reportando progresso real. */
function enviarBlob(
  url: string,
  blob: Blob,
  signal: AbortSignal | undefined,
  onProgress: ((carregado: number) => void) | undefined,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader('ETag') ?? '')
        return
      }
      reject(new Error(`Falha no upload (HTTP ${xhr.status}).`))
    }
    xhr.onerror = () => reject(new Error('Falha de rede durante o upload.'))
    xhr.onabort = () => reject(new DOMException('Upload cancelado.', 'AbortError'))

    const abortar = () => xhr.abort()
    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', abortar, { once: true })
    }

    xhr.send(blob)
  })
}

/**
 * Envia o arquivo conforme a estrategia definida pelo backend.
 *
 * - `REUTILIZADO`: nada e transmitido (deduplicacao por SHA-256).
 * - `PUT`: um unico envio direto ao storage.
 * - `MULTIPART`: partes paralelas com concorrencia limitada.
 */
export async function enviarArquivo(
  file: File,
  sessao: UploadSession,
  options: UploadOptions = {},
): Promise<UploadedPart[]> {
  const total = file.size
  const inicio = performance.now()
  const emitir = (fase: UploadProgress['fase'], enviado: number) =>
    options.onProgress?.(progresso(fase, enviado, total, inicio))

  if (sessao.reutilizado || sessao.estrategia === 'REUTILIZADO') {
    emitir('concluindo', total)
    return []
  }

  if (sessao.estrategia === 'PUT') {
    const url = sessao.partes[0]?.url
    if (!url) throw new Error('Sessão de upload inválida.')
    emitir('enviando', 0)
    await enviarBlob(url, file, options.signal, (carregado) => emitir('enviando', carregado))
    emitir('concluindo', total)
    return []
  }

  const totalPartes = sessao.partes.length
  const partes = new Map<number, string>()
  const carregados = new Map<number, number>()
  let enviado = 0
  let ativos = 0
  let proximoIndice = 0

  emitir('enviando', 0)

  return new Promise<UploadedPart[]>((resolve, reject) => {
    const falhar = (error: unknown) => reject(error)

    const iniciarProxima = () => {
      if (options.signal?.aborted) {
        falhar(new DOMException('Upload cancelado.', 'AbortError'))
        return
      }
      if (partes.size === totalPartes) {
        emitir('concluindo', total)
        resolve(
          Array.from(partes.entries())
            .map(([partNumber, etag]) => ({ partNumber, etag }))
            .sort((a, b) => a.partNumber - b.partNumber),
        )
        return
      }

      while (ativos < CONCORRENCIA_PARTES && proximoIndice < totalPartes) {
        const indice = proximoIndice
        proximoIndice += 1
        ativos += 1
        const parte = sessao.partes[indice]
        const inicioBytes = indice * sessao.partSize
        const fimBytes = Math.min(inicioBytes + sessao.partSize, file.size)
        const blob = file.slice(inicioBytes, fimBytes)

        enviarBlob(parte.url, blob, options.signal, (carregado) => {
          const anterior = carregados.get(parte.partNumber) ?? 0
          const delta = Math.max(0, carregado - anterior)
          carregados.set(parte.partNumber, carregado)
          enviado = Math.min(total, enviado + delta)
          emitir('enviando', enviado)
        })
          .then((etag) => {
            partes.set(parte.partNumber, etag)
            ativos -= 1
            iniciarProxima()
          })
          .catch(falhar)
      }
    }

    iniciarProxima()
  })
}
