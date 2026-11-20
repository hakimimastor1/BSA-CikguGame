import { useEffect, useRef, useState } from 'react'
import { BriefcaseBusiness, Gift, Users, WifiOff } from 'lucide-react'
import { Mentol } from '../components/Mentol'
import { Qr, gameUrl } from '../components/Qr'
import { PERSONALITIES } from '../content/story'
import { TRAIT_ICON } from '../screens/Result'
import { eventSlug, leaderboard, online, type Board } from '../lib/api'
import { EVENT } from '../content/event'

const POLL_MS = 5000

/** Projector screen for the booth: QR code, today's top 10 and the latest results. Updates every 5 s. */
export default function Tv() {
  const [board, setBoard] = useState<Board | null>(null)
  const [stale, setStale] = useState(false)
  const prevTop = useRef<string[]>([])
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  useEffect(() => {
    document.title = 'Cikgu Sehari · Papan Skor'
    if (!online) return
    let alive = true
    const load = async () => {
      try {
        const b = await leaderboard(eventSlug)
        if (!alive) return
        const names = b.top.map((r) => r.nickname)
        setFresh(new Set(names.filter((n, i) => prevTop.current[i] !== n)))
        prevTop.current = names
        setBoard(b)
        setStale(false)
      } catch {
        if (alive) setStale(true)
      }
    }
    void load()
    const id = window.setInterval(load, POLL_MS)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  // Keep the projector laptop from sleeping or dimming while this page is open.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const request = () => {
      if (document.visibilityState !== 'visible' || !nav.wakeLock) return
      nav.wakeLock
        .request('screen')
        .then((l) => (lock = l))
        .catch(() => undefined)
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      void lock?.release().catch(() => undefined)
    }
  }, [])

  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const url = gameUrl(eventSlug)
  const top = board?.top ?? []

  return (
    <div
      className="relative flex h-dvh w-full overflow-hidden bg-navy-deep font-body text-white"
      onClick={() => {
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => undefined)
      }}
    >
      {!fullscreen && (
        <p className="absolute left-1/2 top-[0.6vh] z-20 -translate-x-1/2 rounded-full bg-white/15 px-[1vw] py-[0.4vh] text-[0.9vw] font-bold text-sky">
          Klik di mana-mana untuk skrin penuh
        </p>
      )}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 22% 55%, rgba(249,196,20,0.07) 0deg 7.5deg, transparent 7.5deg 15deg)',
        }}
      />

      {/* Left: call to action */}
      <section className="relative z-10 flex w-[38%] shrink-0 flex-col items-center justify-between gap-[1.5vh] px-[2.5vw] py-[3vh] text-center">
        <img src="/bsa-wordmark-on-navy.png" alt="Bright Scholar Academy" className="w-[80%]" />
        <div>
          <h1 className="font-display text-[4.6vw] font-extrabold leading-none text-yellow">Jadi Cikgu Sehari!</h1>
          <p className="mt-[0.6vh] font-display text-[1.7vw] font-bold text-sky">Be a Cikgu for a Day!</p>
        </div>
        <div className="flex items-center gap-[1.5vw]">
          <div className="rounded-[1.6vw] border-[0.35vw] border-yellow bg-white p-[0.9vw] shadow-[0_0.6vw_0_#F9C414]">
            <Qr value={url} className="h-[30vh] w-[30vh]" />
          </div>
        </div>
        <p className="font-display text-[2.4vw] font-extrabold leading-tight">
          Imbas &amp; main! <span className="text-sky">· Scan &amp; play!</span>
        </p>
        <div className="grid w-full grid-cols-2 gap-[0.8vw] text-left font-display leading-tight">
          <div className="rounded-[1.2vw] border-[0.22vw] border-yellow px-[1vw] py-[0.8vh]">
            <p className="flex items-center gap-[0.5vw] text-[1.05vw] font-bold text-sky">
              <BriefcaseBusiness className="h-[1.3vw] w-[1.3vw] text-yellow" strokeWidth={2.5} /> Graduan UPSI
            </p>
            <p className="text-[1.3vw] font-extrabold">Jadi tutor BSA</p>
            <p className="text-[1.05vw] font-bold text-yellow">RM25–40/jam</p>
          </div>
          <div className="rounded-[1.2vw] border-[0.22vw] border-yellow px-[1vw] py-[0.8vh]">
            <p className="flex items-center gap-[0.5vw] text-[1.05vw] font-bold text-sky">
              <Gift className="h-[1.3vw] w-[1.3vw] text-yellow" strokeWidth={2.5} /> Adik-adik sekolah
            </p>
            <p className="text-[1.3vw] font-extrabold">Trial percuma 3 subjek</p>
            <p className="text-[1.05vw] font-bold text-yellow">Kod {board?.event.offerCode ?? EVENT.offerCode}</p>
          </div>
        </div>
        <p className="text-[1vw] text-sky/80">{url.replace(/^https?:\/\//, '')}</p>
      </section>

      {/* Right: leaderboard */}
      <section className="relative z-10 flex min-w-0 flex-1 flex-col py-[3vh] pr-[2.5vw]">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-[2.8vw] font-extrabold leading-none">
            Papan Skor Hari Ini <span className="text-[1.6vw] text-sky">· Today's Top 10</span>
          </h2>
          <p className="flex items-center gap-[0.5vw] font-display text-[1.5vw] font-bold text-sky">
            <Users className="h-[1.6vw] w-[1.6vw]" strokeWidth={2.5} />
            {board?.players ?? 0} pemain
            {stale && <WifiOff className="ml-[0.5vw] h-[1.4vw] w-[1.4vw] text-yellow" strokeWidth={2.5} aria-label="Menyambung semula" />}
          </p>
        </div>

        <ol className="mt-[2vh] flex flex-1 flex-col gap-[1vh]">
          {top.map((r, i) => {
            const Icon = TRAIT_ICON[r.personality]
            const podium = i < 3
            return (
              <li
                key={r.nickname}
                className={`flex flex-1 items-center gap-[1.2vw] rounded-[1vw] border-[0.22vw] px-[1.2vw] ${
                  podium ? 'border-yellow bg-yellow text-navy' : 'border-white/25 bg-white/8'
                } ${fresh.has(r.nickname) ? 'anim-pop' : ''}`}
                style={{ maxHeight: '8.2vh' }}
              >
                <span
                  className={`flex h-[5vh] w-[5vh] shrink-0 items-center justify-center rounded-full font-display text-[1.7vw] font-extrabold ${
                    podium ? 'bg-navy text-yellow' : 'bg-white/15'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-display text-[2vw] font-bold">{r.nickname}</span>
                <span className={`flex items-center gap-[0.4vw] text-[1.15vw] font-bold ${podium ? 'text-navy' : 'text-sky'}`}>
                  <Icon className="h-[1.4vw] w-[1.4vw]" strokeWidth={2.5} />
                  {PERSONALITIES[r.personality].name}
                </span>
                <span className="w-[8vw] text-right font-display text-[2.2vw] font-extrabold tabular-nums">{r.xp}</span>
              </li>
            )
          })}
          {top.length === 0 && (
            <li className="flex flex-1 flex-col items-center justify-center gap-[2vh] rounded-[1.5vw] border-[0.22vw] border-dashed border-white/30">
              <Mentol size={180} mood="cheer" bob glow={1} />
              <p className="font-display text-[2.6vw] font-extrabold text-yellow">Jadilah yang pertama!</p>
              <p className="font-display text-[1.6vw] font-bold text-sky">Be the first on the board today!</p>
              {!online && <p className="text-[1vw] text-sky">(Sambungan pangkalan data belum disediakan)</p>}
            </li>
          )}
        </ol>

        {board && board.latest.length > 0 && (
          <div className="mt-[2vh] overflow-hidden rounded-full border-[0.2vw] border-white/25 bg-white/8 py-[0.8vh]">
            <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-[3vw] whitespace-nowrap pl-[100%] font-display text-[1.4vw] font-bold">
              {board.latest.map((l, i) => (
                <span key={i}>
                  <span className="text-yellow">{l.nickname}</span> ialah {PERSONALITIES[l.personality].name} · {l.xp} XP
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-100%) } }`}</style>
    </div>
  )
}
