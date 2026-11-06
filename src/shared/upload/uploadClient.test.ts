import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { enviarArquivo } from '@/shared/upload/uploadClient'
import type { UploadSession } from '@/shared/upload/types'

class FakeXHR {
  static instances: FakeXHR[] = []
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null }
  status = 200
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  sent: Blob | null = null

  constructor() {
    FakeXHR.instances.push(this)
  }

  open() {}
  setRequestHeader() {}
  getResponseHeader() {
    return '"etag-fake"'
  }
  send(blob: Blob) {
    this.sent = blob
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded: blob.size,
      total: blob.size,
    } as ProgressEvent)
    this.onload?.()
  }
  abort() {
    this.onabort?.()
  }
}

function arquivo(tamanho: number): File {
  return new File([new Uint8Array(tamanho)], 'foto.jpg', { type: 'image/jpeg' })
}

function sessao(overrides: Partial<UploadSession>): UploadSession {
  return {
    arquivoId: 'arq-1',
    uploadId: 'upload-1',
    reutilizado: false,
    estrategia: 'PUT',
    tamanho: 10,
    partSize: 0,
    partes: [{ partNumber: 1, url: 'https://storage/put' }],
    expiraEm: null,
    ...overrides,
  }
}

describe('enviarArquivo', () => {
  beforeEach(() => {
    FakeXHR.instances = []
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia PUT único e reporta progresso', async () => {
    const progresso: number[] = []
    const file = arquivo(10)

    const partes = await enviarArquivo(file, sessao({}), {
      onProgress: (value) => progresso.push(value.percentual),
    })

    expect(partes).toEqual([])
    expect(FakeXHR.instances).toHaveLength(1)
    expect(FakeXHR.instances[0].sent).toBe(file)
    expect(progresso).toContain(100)
  })

  it('envia multipart e retorna as partes com ETag', async () => {
    const file = arquivo(6)
    const sessaoMultipart = sessao({
      estrategia: 'MULTIPART',
      partSize: 4,
      partes: [
        { partNumber: 1, url: 'https://storage/part/1' },
        { partNumber: 2, url: 'https://storage/part/2' },
      ],
    })

    const partes = await enviarArquivo(file, sessaoMultipart, {
      onProgress: () => undefined,
    })

    expect(partes).toEqual([
      { partNumber: 1, etag: '"etag-fake"' },
      { partNumber: 2, etag: '"etag-fake"' },
    ])
    expect(FakeXHR.instances).toHaveLength(2)
  })

  it('não transmite quando o backend reutiliza o arquivo', async () => {
    const partes = await enviarArquivo(
      arquivo(10),
      sessao({ reutilizado: true, estrategia: 'REUTILIZADO' }),
    )

    expect(partes).toEqual([])
    expect(FakeXHR.instances).toHaveLength(0)
  })
})
