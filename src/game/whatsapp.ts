/** Normalise a Malaysian mobile number to international digits (60…), or null if it doesn't look valid. */
export function normaliseMyPhone(input: string): string | null {
  let d = input.replace(/\D/g, '')
  if (d.startsWith('0')) d = '6' + d
  else if (d.startsWith('1')) d = '60' + d
  if (!/^601\d{8,9}$/.test(d)) return null
  return d
}

export const waLink = (numberIntl: string, text: string) =>
  `https://wa.me/${numberIntl}?text=${encodeURIComponent(text)}`

/** Short reference like PK-4F7Q, readable over the phone (no 0/O/1/I). */
export function makeReference(prefix = 'PK'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s}`
}
