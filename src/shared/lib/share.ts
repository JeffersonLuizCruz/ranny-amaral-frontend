import { copiarTexto } from '@/shared/lib/clipboard'

export type ResultadoCompartilhamento =
  | 'compartilhado'
  | 'copiado'
  | 'cancelado'
  | 'falhou'

/**
 * Abre a folha nativa de compartilhamento quando disponível (mobile) e cai
 * para a cópia do link quando não houver suporte ou o compartilhamento falhar.
 */
export async function compartilharLink(
  titulo: string,
  url: string,
): Promise<ResultadoCompartilhamento> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: titulo, text: titulo, url })
      return 'compartilhado'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelado'
      }
    }
  }

  return (await copiarTexto(url)) ? 'copiado' : 'falhou'
}
