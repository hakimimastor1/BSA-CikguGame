import { useEffect, useRef, useState } from 'react'
import { BriefcaseBusiness, Gift, GraduationCap, Presentation, Sticker, Users, WifiOff } from 'lucide-react'
import { Mentol } from '../components/Mentol'
import { Qr, gameUrl } from '../components/Qr'
import { PERSONALITY_INFO } from '../content/personalities'
import { TRAIT_ICON } from '../screens/Result'
import { eventSlug, leaderboard, online, type Board } from '../lib/api'
import type { Game } from '../types'
import { EVENT } from '../content/event'

const POLL_MS = 5000
/** Names per board when the server does not say (older servers). Admin can choose 3, 5 or 10. */
const DEFAULT_SIZE = 5

type Row = Board['top'][number]

const BOARDS: { game: Game; title: string; sub: string; icon: typeof Presentation }[] = [
  { game: 'cikgu', title: 'Top Cikgu Sehari', sub: 'Bakal cikgu · Future teachers', icon: Presentation },
  { game: 'pelajar', title: 'Top Pelajar Bijak', sub: 'Pelajar sekolah · School students', icon: GraduationCap },
]

/** The top names for each game. Older servers only send `top` (Cikgu Sehari). */
const rowsFor = (b: Board | null, g: Game): Row[] =>
  (b?.boards?.[g] ?? (g === 'cikgu' ? (b?.top ?? []) : [])).slice(0, b?.size ?? DEFAULT_SIZE)

/** Projector screen for the booth: QR code, today's top 5 for each game and the latest results. Updates every 5 s. */
export default function Tv() {
  const [board, setBoard] = useState<Board | null>(null)
  const [stale, setStale] = useState(false)
  const prevTop = useRef<string[]>([])
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  useEffect(() => {
    document.title = 'BSA · Papan Skor'
    if (!online) return
    let alive = true
    const load = async () => {
      try {
        const b = await leaderboard(eventSlug)
        if (!alive) return
        // A name that is new to its spot on either board pops in.
        const names = BOARDS.flatMap(({ game }) => rowsFor(b, game).map((r, i) => `${game}:${i}:${r.nickname}`))
        setFresh(new Set(names.filter((n) => !prevTop.current.includes(n))))
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
  // Manual mode (default): boards run until an admin resets them. Daily: fresh every midnight.
  const daily = board?.mode === 'daily'
  const size = board?.size ?? DEFAULT_SIZE
  const dense = size > 5

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
          <h1 className="font-display text-[4.6vw] font-extrabold leading-none text-yellow">Jom Main!</h1>
          <p className="mt-[0.6vh] font-display text-[1.7vw] font-bold text-sky">2 permainan · 1 QR · Let's play!</p>
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
              <BriefcaseBusiness className="h-[1.3vw] w-[1.3vw] text-yellow" strokeWidth={2.5} /> Pelajar UPSI
            </p>
            <p className="text-[1.3vw] font-extrabold">Cikgu Sehari</p>
            <p className="text-[1.05vw] font-bold">Jadi tutor BSA</p>
            <p className="text-[1.05vw] font-bold text-yellow">RM25–40/jam</p>
          </div>
          <div className="rounded-[1.2vw] border-[0.22vw] border-yellow px-[1vw] py-[0.8vh]">
            <p className="flex items-center gap-[0.5vw] text-[1.05vw] font-bold text-sky">
              <Gift className="h-[1.3vw] w-[1.3vw] text-yellow" strokeWidth={2.5} /> Adik-adik sekolah
            </p>
            <p className="text-[1.3vw] font-extrabold">Misi Pelajar Bijak</p>
            <p className="text-[1.05vw] font-bold">Trial percuma + beg</p>
            <p className="text-[1.05vw] font-bold text-yellow">Kod {board?.event.offerCode ?? EVENT.offerCode}</p>
          </div>
        </div>
        <p className="flex items-center gap-[0.5vw] font-display text-[1.25vw] font-bold text-yellow">
          <Sticker className="h-[1.4vw] w-[1.4vw]" strokeWidth={2.5} /> Semua pemain dapat sticker!
        </p>
        <p className="text-[1vw] text-sky/80">{url.replace(/^https?:\/\//, '')}</p>
      </section>

      {/* Right: one board per game */}
      <section className="relative z-10 flex min-w-0 flex-1 flex-col py-[3vh] pr-[2.5vw]">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-[2.8vw] font-extrabold leading-none">
            {daily ? 'Papan Skor Hari Ini' : 'Papan Skor'}{' '}
            <span className="text-[1.6vw] text-sky">· {daily ? "Today's" : ''} Top {size}</span>
          </h2>
          <p className="flex items-center gap-[0.5vw] font-display text-[1.5vw] font-bold text-sky">
            <Users className="h-[1.6vw] w-[1.6vw]" strokeWidth={2.5} />
            {board?.players ?? 0} pemain
            {stale && <WifiOff className="ml-[0.5vw] h-[1.4vw] w-[1.4vw] text-yellow" strokeWidth={2.5} aria-label="Menyambung semula" />}
          </p>
        </div>

        <div className="mt-[2vh] grid min-h-0 flex-1 grid-cols-2 gap-[1.5vw]">
          {BOARDS.map(({ game, title, sub, icon: GameIcon }) => {
            const rows = rowsFor(board, game)
            const count = board?.playersByGame?.[game]
            return (
              <div key={game} className="flex min-w-0 flex-col rounded-[1.4vw] border-[0.22vw] border-white/25 bg-white/5 p-[1vw]">
                <div className="flex items-center gap-[0.8vw]">
                  <span className="flex h-[6vh] w-[6vh] shrink-0 items-center justify-center rounded-[0.8vw] bg-yellow text-navy">
                    <GameIcon className="h-[3.4vh] w-[3.4vh]" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[2vw] font-extrabold leading-none text-yellow">{title}</h3>
                    <p className="mt-[0.4vh] truncate text-[0.95vw] font-bold text-sky">{sub}</p>
                  </div>
                  {count != null && (
                    <span className="shrink-0 font-display text-[1.1vw] font-bold text-sky">{count} pemain</span>
                  )}
                </div>

                <ol className={`mt-[1.5vh] flex flex-1 flex-col ${dense ? 'gap-[0.7vh]' : 'gap-[1vh]'}`}>
                  {rows.map((r, i) => {
                    const Icon = TRAIT_ICON[r.personality]
                    const first = i === 0
                    return (
                      <li
                        key={`${r.nickname}-${i}`}
                        className={`flex flex-1 items-center gap-[0.9vw] rounded-[1vw] border-[0.22vw] px-[0.9vw] ${
                          i < 3 ? 'border-yellow' : 'border-white/25'
                        } ${first ? 'bg-yellow text-navy' : i < 3 ? 'bg-yellow/15' : 'bg-white/8'} ${
                          fresh.has(`${game}:${i}:${r.nickname}`) ? 'anim-pop' : ''
                        }`}
                        style={{ maxHeight: dense ? '6.4vh' : '11vh' }}
                      >
                        <span
                          className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold ${
                            dense ? 'h-[4.2vh] w-[4.2vh] text-[1.3vw]' : 'h-[5vh] w-[5vh] text-[1.6vw]'
                          } ${
                            first ? 'bg-navy text-yellow' : i < 3 ? 'bg-yellow text-navy' : 'bg-white/15'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={`truncate font-display font-bold leading-tight ${dense ? 'text-[1.4vw]' : 'text-[1.8vw]'}`}>{r.nickname}</span>
                          <span className={`flex items-center gap-[0.35vw] truncate font-bold ${dense ? 'text-[0.8vw]' : 'text-[0.95vw]'} ${first ? 'text-navy' : 'text-sky'}`}>
                            <Icon className="h-[1.1vw] w-[1.1vw] shrink-0" strokeWidth={2.5} />
                            {PERSONALITY_INFO[r.personality].name}
                          </span>
                        </span>
                        <span className={`shrink-0 text-right font-display font-extrabold tabular-nums ${dense ? 'text-[1.6vw]' : 'text-[2vw]'}`}>
                          {r.xp}
                          <span className="ml-[0.2vw] text-[0.9vw]">XP</span>
                        </span>
                      </li>
                    )
                  })}
                  {rows.length === 0 && (
                    <li className="flex flex-1 flex-col items-center justify-center gap-[1.5vh] rounded-[1.2vw] border-[0.22vw] border-dashed border-white/30 text-center">
                      <Mentol size={120} mood="cheer" bob glow={1} />
                      <p className="font-display text-[2vw] font-extrabold text-yellow">Jadilah yang pertama!</p>
                      <p className="font-display text-[1.2vw] font-bold text-sky">Be the first on this board!</p>
                      {!online && <p className="text-[0.9vw] text-sky">(Sambungan pangkalan data belum disediakan)</p>}
                    </li>
                  )}
                </ol>
              </div>
            )
          })}
        </div>

        {board && board.latest.length > 0 && (
          <div className="mt-[2vh] overflow-hidden rounded-full border-[0.2vw] border-white/25 bg-white/8 py-[0.8vh]">
            <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-[3vw] whitespace-nowrap pl-[100%] font-display text-[1.4vw] font-bold">
              {board.latest.map((l, i) => (
                <span key={i}>
                  <span className="text-yellow">{l.nickname}</span> ialah {PERSONALITY_INFO[l.personality].name} · {l.xp} XP
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
