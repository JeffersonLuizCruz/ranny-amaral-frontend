/**
 * Copia texto para a área de transferência.
 *
 * No iOS a Clipboard API exige HTTPS e um gesto do usuário. Quando ela não
 * existe (ex.: acesso por IP na rede local) caímos num `textarea` temporário
 * com `execCommand`, executado de forma síncrona para preservar o gesto.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      // segue para o fallback
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, texto.length)
    const copiado = document.execCommand('copy')
    area.remove()
    return copiado
  } catch {
    return false
  }
}
