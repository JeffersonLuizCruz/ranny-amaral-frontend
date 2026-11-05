export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatWhatsApp(value: string): string {
  const digits = digitsOnly(value).slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidWhatsApp(value: string): boolean {
  const digits = digitsOnly(value)
  return digits.length >= 10 && digits.length <= 11
}

export function whatsappLink(value: string, message?: string): string {
  const digits = digitsOnly(value)
  const withCountry = digits.length >= 12 ? digits : `55${digits}`
  const query = message ? `?text=${encodeURIComponent(message)}` : ''

  return `https://wa.me/${withCountry}${query}`
}
