import { useEffect } from 'react'
import { BriefcaseBusiness, Gift, Printer, ScanLine, Shuffle, Sticker, Trophy } from 'lucide-react'
import { Mentol } from '../components/Mentol'
import { Qr, gameUrl } from '../components/Qr'
import { EVENT } from '../content/event'
import { eventSlug } from '../lib/api'

/** Printable QR poster (A4 or A3 portrait). Open /poster?e=peskon26 and print. */
export default function Poster() {
  useEffect(() => {
    document.title = 'BSA · Poster QR'
  }, [])
  const url = gameUrl(eventSlug)
  const steps = [
    { icon: ScanLine, ms: 'Imbas kod QR', en: 'Scan the QR code' },
    { icon: Shuffle, ms: 'Pilih permainan', en: 'Pick your game' },
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
          <h1 className="mt-[4%] font-display text-[clamp(2rem,9vw,4.4rem)] font-extrabold leading-none text-yellow">Jom Main!</h1>
          <p className="mt-[1.5%] font-display text-[clamp(1rem,3.4vw,1.7rem)] font-bold text-sky">2 permainan · 3 minit · Let's play!</p>
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

        <div className="w-full bg-yellow px-[5%] pb-[3%] pt-[2.5%]">
          <p className="mb-2 flex items-center justify-center gap-2 font-display text-[clamp(1.1rem,3.6vw,1.6rem)] font-extrabold">
            <Sticker size={24} strokeWidth={2.5} /> Semua pemain dapat sticker!
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border-[3px] border-navy bg-white p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
                <BriefcaseBusiness size={18} strokeWidth={2.5} /> Pelajar &amp; graduan UPSI
              </p>
              <p className="font-display text-[clamp(1.1rem,3.6vw,1.6rem)] font-extrabold leading-tight">Cikgu Sehari</p>
              <p className="font-bold">Jadi tutor BSA · RM25–40/jam</p>
            </div>
            <div className="rounded-2xl border-[3px] border-navy bg-white p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
                <Gift size={18} strokeWidth={2.5} /> Adik-adik sekolah
              </p>
              <p className="font-display text-[clamp(1.1rem,3.6vw,1.6rem)] font-extrabold leading-tight">Misi Pelajar Bijak</p>
              <p className="font-bold">
                Trial 3 subjek percuma + beg · kod <span className="whitespace-nowrap font-display font-extrabold">{EVENT.offerCode}</span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-bold">{url.replace(/^https?:\/\//, '')} · WhatsApp {EVENT.whatsappDisplay}</p>
        </div>
      </article>
    </div>
  )
}
