/** Limite de comprovante/anexo definido pelo backend. */
export const MAX_PROOF_SIZE = 10 * 1024 * 1024

export const PROOF_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'

const TIPOS_ACEITOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

/** Validação de UX; o backend continua sendo a autoridade final. */
export function validateProofFile(file: File): string | null {
  if (file.size <= 0) return 'O arquivo está vazio.'
  if (file.size > MAX_PROOF_SIZE) return 'O comprovante deve ter no máximo 10 MB.'
  if (!TIPOS_ACEITOS.has(file.type)) {
    return 'Envie um arquivo PDF, JPEG, PNG ou WebP.'
  }
  return null
}
