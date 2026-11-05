export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export function normalizeHex(hex: string): string {
  const value = hex.trim().replace('#', '')

  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .split('')
      .map((character) => character + character)
      .join('')}`
  }

  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value}`
  }

  return '#64748b'
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex).slice(1)
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const safeAlpha = Math.max(0, Math.min(1, alpha))

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`
}
