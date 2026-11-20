import { useState } from 'react'
import { ArrowRight, HeartHandshake, Palette, RotateCcw, Share2, Sparkles, Sticker, Target, TrendingUp, Trophy } from 'lucide-react'
import type { Lang, PlayResult, Player, Trait } from '../types'
import { S, fill, t } from '../content/strings'
import { PERSONALITIES } from '../content/story'
import { BANDS, SUBJECT_NAMES } from '../content/subjects'
import { Mentol } from '../components/Mentol'
import { Confetti, useCountUp } from '../components/ui'
import { shareCard } from '../game/shareCard'

export const TRAIT_ICON: Record<Trait, typeof Palette> = {
  kreatif: Palette,
  penyayang: HeartHandshake,
  strategik: Target,
  inspirasi: Sparkles,
}

export function Result({
  lang,
  player,
  result,
  onClaim,
  onAgain,
}: {
  lang: Lang
  player: Player
  result: PlayResult
  onClaim: () => void
  onAgain: () => void
}) {
  const [shown, setShown] = useState(0)
  const [sharing, setSharing] = useState(false)
  useCountUp(result.totalXp, 1100, setShown)
  const p = PERSONALITIES[result.personality]
  const Icon = TRAIT_ICON[result.personality]
  const band = BANDS.find((b) => b.id === player.band)!
  const isTutor = player.role === 'cikgu'

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Confetti />
      <section className="clay-card overflow-hidden text-center anim-pop">
        <div className="relative bg-navy px-5 pb-6 pt-5 text-white">
          <p className="font-display text-lg font-bold text-sky">{t(S.resultKicker, lang)}</p>
          <div className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-yellow text-navy">
            <Icon size={48} strokeWidth={2.5} />
          </div>
          <h1 className="mt-3 font-display text-[2.4rem] font-extrabold leading-none text-yellow">{p.name}</h1>
          <p className="mt-1 font-display text-lg font-bold">{t(p.tagline, lang)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[1.05rem] leading-relaxed">{t(p.description, lang)}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Mentol size={56} mood="cheer" glow={Math.min(1, shown / 350)} />
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-wide text-muted">{t(S.resultXp, lang)}</p>
              <p className="font-display text-[2.6rem] font-extrabold leading-none tabular-nums">{shown} XP</p>
            </div>
          </div>
          {result.rank != null && (
            <div className="mx-auto mt-3 inline-flex items-center gap-2.5 rounded-2xl border-[3px] border-navy bg-yellow px-4 py-1.5 text-left anim-pop">
              <Trophy size={22} strokeWidth={2.5} className="shrink-0" />
              <div className="leading-tight">
                <p className="font-display text-lg font-extrabold">{fill(t(S.resultRank, lang), { rank: result.rank })}</p>
                {result.players ? <p className="text-sm font-bold">{fill(t(S.resultRankOf, lang), { n: result.players })}</p> : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 anim-slide" style={{ animationDelay: '200ms' }}>
        <div className="clay-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
            <Trophy size={16} strokeWidth={2.5} />
            {t(S.resultStrongest, lang)}
          </p>
          <p className="mt-1 font-display text-xl font-bold leading-tight">
            {result.strongest ? t(SUBJECT_NAMES[result.strongest], lang) : '–'}
          </p>
        </div>
        <div className="clay-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
            <TrendingUp size={16} strokeWidth={2.5} />
            {t(S.resultLevelUp, lang)}
          </p>
          <p className="mt-1 font-display text-xl font-bold leading-tight">
            {result.levelUp.length
              ? result.levelUp
                  .slice(0, 2)
                  .map((s) => t(SUBJECT_NAMES[s], lang))
                  .join(', ') + (result.levelUp.length > 2 ? ` +${result.levelUp.length - 2}` : '')
              : t(S.resultAllGood, lang)}
          </p>
        </div>
      </section>

      {isTutor && (
        <p className="clay-card bg-yellow-soft p-4 font-bold anim-slide">
          {fill(t(S.resultTutorPay, lang), { level: t(band.label, lang), pay: band.price })}
        </p>
      )}

      <div className="mt-1 flex flex-col gap-3">
        <button type="button" className="clay-btn w-full bg-yellow text-xl" onClick={onClaim}>
          {isTutor ? t(S.resultJoin, lang) : t(S.resultClaim, lang)}
          <ArrowRight size={22} strokeWidth={3} />
        </button>
        <button
          type="button"
          className="clay-btn w-full bg-white"
          disabled={sharing}
          onClick={async () => {
            setSharing(true)
            try {
              await shareCard(result, player.nickname, lang)
            } finally {
              setSharing(false)
            }
          }}
        >
          <Share2 size={20} strokeWidth={2.5} />
          {sharing ? t(S.resultSharing, lang) : t(S.resultShare, lang)}
        </button>
        <p className="flex items-center justify-center gap-2 text-center font-bold">
          <Sticker size={18} strokeWidth={2.5} className="shrink-0" />
          {t(S.resultSticker, lang)}
        </p>
        <button type="button" className="mx-auto inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-bold text-muted underline" onClick={onAgain}>
          <RotateCcw size={16} strokeWidth={2.5} />
          {t(S.resultPlayAgain, lang)}
        </button>
      </div>
    </div>
  )
}
