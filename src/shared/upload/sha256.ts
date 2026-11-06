/**
 * Calcula o SHA-256 do arquivo no navegador.
 *
 * O hash permite deduplicacao: se o mesmo comprovante ja foi enviado, o
 * backend reaproveita o objeto e nenhum byte e transmitido novamente.
 *
 * Para fotos de 50 MB na fase de galerias, esta funcao deve rodar em Web Worker
 * para nao bloquear a thread principal.
 */
export async function sha256File(file: File): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Este navegador não suporta o cálculo de integridade do arquivo.')
  }

  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
