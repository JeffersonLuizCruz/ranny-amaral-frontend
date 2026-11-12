/**
 * Formata bytes para leitura humana.
 *
 * Usa base 1024 e no maximo duas unidades, sem depender do tamanho do disco:
 * total e livre vem medidos do servidor.
 */
export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const unidades = ['KB', 'MB', 'GB', 'TB']
  let valor = bytes
  let unidade = 'B'
  for (const candidata of unidades) {
    valor /= 1024
    unidade = candidata
    if (valor < 1024) break
  }
  const casas = Number.isInteger(valor) ? 0 : valor >= 100 ? 0 : 1
  return `${valor.toFixed(casas).replace('.', ',')} ${unidade}`
}
