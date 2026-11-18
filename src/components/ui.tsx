import { useEffect, useMemo, type ReactNode } from 'react'
import { ChevronLeft, Languages } from 'lucide-react'
import type { Lang } from '../types'
import { S, t } from '../content/strings'

export function Header({
  lang,
  onLang,
  onBack,
  right,
}: {
  lang: Lang
  onLang: () => void
  onBack?: () => void
  right?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-2 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-[3px] border-navy bg-white"
            aria-label={t(S.back, lang)}
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
        ) : (
          <img src="/bsa-wordmark.png" alt="Bright Scholar Academy" className="h-9 w-auto" />
        )}
        {right}
      </div>
      <button
        type="button"
        onClick={onLang}
        className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-[3px] border-navy bg-white px-3 font-display text-base font-bold"
        aria-label={t(S.langSwitchLabel, lang)}
      >
        <Languages size={18} strokeWidth={2.5} />
        {t(S.langSwitch, lang)}
      </button>
    </header>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-6 ${className}`}>{children}</main>
}

export function PreviewBanner({ lang }: { lang: Lang }) {
  return (
    <div className="bg-navy py-1 text-center text-xs font-bold tracking-wide text-yellow">{t(S.preview, lang)}</div>
  )
}

export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 flex-1 rounded-full border-2 border-navy ${i < step ? 'bg-yellow' : 'bg-white'}`}
        />
      ))}
    </div>
  )
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-navy bg-yellow px-3 py-0.5 font-display text-base font-extrabold tabular-nums">
      {xp} XP
    </span>
  )
}

/** Lightweight confetti; skipped entirely when the phone asks for reduced motion. */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.2 + Math.random() * 1.6,
        color: ['#F9C414', '#023E86', '#DCEBFF', '#16804A', '#F28C28'][i % 5],
        size: 6 + Math.random() * 8,
        round: Math.random() > 0.5,
      })),
    [pieces],
  )
  if (reduced) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            background: b.color,
            borderRadius: b.round ? '50%' : 2,
            animation: `confetti-fall ${b.dur}s ${b.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

/** Count up to a number, for XP reveals. */
export function useCountUp(target: number, ms = 900, onTick?: (v: number) => void) {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onTick?.(target)
      return
    }
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      onTick?.(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms])
}
