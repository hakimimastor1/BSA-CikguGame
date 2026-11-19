import { useEffect } from 'react'
import { Gift, Printer, ScanLine, Smartphone, Trophy } from 'lucide-react'
import { Mentol } from '../components/Mentol'
import { Qr, gameUrl } from '../components/Qr'
import { EVENT } from '../content/event'
import { eventSlug } from '../lib/api'

/** Printable QR poster (A4 or A3 portrait). Open /poster?e=peskon26 and print. */
export default function Poster() {
  useEffect(() => {
    document.title = 'Cikgu Sehari · Poster QR'
  }, [])
  const url = gameUrl(eventSlug)
  const steps = [
    { icon: ScanLine, ms: 'Imbas kod QR', en: 'Scan the QR code' },
    { icon: Smartphone, ms: 'Main 3 minit', en: 'Play for 3 minutes' },
    { icon: Trophy, ms: 'Masuk papan skor!', en: 'Get on the leaderboard!' },
  ]

  return (
    <div className="min-h-dvh bg-[#e9edf5] py-6 print:bg-white print:py-0">
      <style>{`@page { size: A4 portrait; margin: 0 } @media print { html, body { background: #fff !important } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end px-4 print:hidden">
        <button type="button" className="clay-btn bg-yellow" onClick={() => window.print()}>
          <Printer size={20} strokeWidth={2.5} />
          Cetak / Print
        </button>
      </div>

      <article className="mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col items-center overflow-hidden bg-white text-center text-navy shadow-xl print:shadow-none">
        <div className="relative flex w-full flex-col items-center bg-navy px-[6%] pb-[4%] pt-[5%] text-white">
          <img src="/bsa-wordmark-on-navy.png" alt="Bright Scholar Academy" className="w-[70%]" />
          <h1 className="mt-[4%] font-display text-[clamp(2rem,9vw,4.4rem)] font-extrabold leading-none text-yellow">Jadi Cikgu Sehari!</h1>
          <p className="mt-[1.5%] font-display text-[clamp(1rem,3.4vw,1.7rem)] font-bold text-sky">Be a Cikgu for a Day!</p>
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-[2.2%] px-[8%] py-[3%]">
          <div className="relative">
            <div className="rounded-[2rem] border-[6px] border-navy bg-white p-3 shadow-[0_8px_0_#023E86]">
              <Qr value={url} className="h-[min(52vw,88mm)] w-[min(52vw,88mm)]" />
            </div>
            <div className="absolute -right-[22%] -top-[12%] rotate-12">
              <Mentol size={96} mood="cheer" glow={1} />
            </div>
          </div>
          <p className="font-display text-[clamp(1.6rem,6vw,2.8rem)] font-extrabold leading-tight">
            Imbas &amp; main! <span className="text-muted">· Scan &amp; play!</span>
          </p>
          <ol className="grid w-full grid-cols-3 gap-3">
            {steps.map(({ icon: Icon, ms, en }, i) => (
              <li key={i} className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-navy bg-cream p-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow">
                  <Icon size={26} strokeWidth={2.5} />
                </span>
                <span className="font-display text-lg font-bold leading-tight">{ms}</span>
                <span className="text-sm text-muted">{en}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex w-full flex-col items-center gap-1 bg-yellow px-[6%] py-[4%]">
          <p className="flex items-center gap-2 font-display text-[clamp(1.2rem,4.4vw,2rem)] font-extrabold">
            <Gift size={28} strokeWidth={2.5} />
            Trial percuma 3 subjek!
          </p>
          <p className="font-bold">
            Kod <span className="font-display text-xl font-extrabold">{EVENT.offerCode}</span> · Free trial for 3 subjects
          </p>
          <p className="mt-1 text-sm font-bold">{url.replace(/^https?:\/\//, '')} · WhatsApp {EVENT.whatsappDisplay}</p>
        </div>
      </article>
    </div>
  )
}
