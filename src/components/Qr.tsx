import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** Link to the game for an event, as encoded in QR codes. */
export const gameUrl = (slug: string) => `${window.location.origin}/?e=${encodeURIComponent(slug)}`

/** A crisp SVG QR code. Dark modules are navy for brand, which phones still scan reliably. */
export function Qr({ value, className = '', dark = '#012A5C' }: { value: string; className?: string; dark?: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark, light: '#FFFFFF' } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(''))
    return () => {
      alive = false
    }
  }, [value, dark])
  return (
    <div
      className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      role="img"
      aria-label={value}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
