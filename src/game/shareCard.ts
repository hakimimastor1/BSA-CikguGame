import type { Lang, PlayResult } from '../types'
import { PERSONALITIES } from '../content/story'
import { EVENT } from '../content/event'
import { S, fill, t } from '../content/strings'

const W = 1080
const H = 1920

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

/** Draw the 1080×1920 story-size result card. */
export async function drawShareCard(result: PlayResult, nickname: string, lang: Lang): Promise<Blob> {
  await Promise.all([
    document.fonts.load('800 120px "Baloo 2"'),
    document.fonts.load('700 48px "Baloo 2"'),
    document.fonts.load('400 40px Lato'),
  ]).catch(() => undefined)
  const [mark, wordmark] = await Promise.all([loadImage('/bsa-mark-on-navy.png'), loadImage('/bsa-wordmark-on-navy.png')])

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#023E86')
  bg.addColorStop(1, '#012A5C')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Sunburst behind the bulb.
  ctx.save()
  ctx.translate(W / 2, 760)
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24)
    ctx.fillStyle = i % 2 ? 'rgba(249,196,20,0.10)' : 'rgba(249,196,20,0.04)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-90, -1100)
    ctx.lineTo(90, -1100)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  const wmW = 760
  ctx.drawImage(wordmark, (W - wmW) / 2, 110, wmW, (wmW * wordmark.height) / wordmark.width)

  const p = PERSONALITIES[result.personality]
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 56px "Baloo 2", sans-serif'
  ctx.fillText(t(S.resultKicker, lang), W / 2, 420)

  const markW = 420
  ctx.drawImage(mark, (W - markW) / 2, 470, markW, (markW * mark.height) / mark.width)

  ctx.fillStyle = '#F9C414'
  ctx.font = '800 128px "Baloo 2", sans-serif'
  ctx.fillText(p.name, W / 2, 1130)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '400 44px Lato, sans-serif'
  wrap(ctx, t(p.description, lang), 860).forEach((line, i) => ctx.fillText(line, W / 2, 1215 + i * 60))

  // XP badge
  roundRect(ctx, 290, 1380, 500, 150, 40)
  ctx.fillStyle = '#F9C414'
  ctx.fill()
  ctx.lineWidth = 8
  ctx.strokeStyle = '#FFFFFF'
  ctx.stroke()
  ctx.fillStyle = '#023E86'
  ctx.font = '800 96px "Baloo 2", sans-serif'
  ctx.fillText(`${result.totalXp} XP`, W / 2, 1488)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 52px "Baloo 2", sans-serif'
  ctx.fillText(nickname, W / 2, 1620)

  ctx.font = '400 38px Lato, sans-serif'
  ctx.fillStyle = '#DCEBFF'
  ctx.fillText(lang === 'ms' ? `Main Cikgu Sehari di booth BSA · ${EVENT.name}` : `Play Cikgu Sehari at the BSA booth · ${EVENT.name}`, W / 2, 1760)
  ctx.fillText('brightscholaracademy.com.my', W / 2, 1815)

  return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}

/** Share with the phone's share sheet, or download the image if sharing files isn't supported. */
export async function shareCard(result: PlayResult, nickname: string, lang: Lang) {
  const blob = await drawShareCard(result, nickname, lang)
  const file = new File([blob], 'cikgu-sehari.png', { type: 'image/png' })
  const text = fill(t(S.shareText, lang), { name: PERSONALITIES[result.personality].name, xp: result.totalXp, event: EVENT.name })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cikgu-sehari.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
