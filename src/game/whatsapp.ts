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

/** A random id for one filled-in form (RFC 4122 v4), so the server can spot the same form sent twice. */
export function newClientId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* older browsers: fall through */
  }
  const b = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Short reference like PK-4F7Q, readable over the phone (no 0/O/1/I). */
export function makeReference(prefix = 'PK'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s}`
}
