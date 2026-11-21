import { useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, Store } from 'lucide-react'
import type { Lang, Player } from '../types'
import { S, fill, t } from '../content/strings'
import { EVENT, eventOver } from '../content/event'
import { BANDS, trialValue } from '../content/subjects'
import { Mentol } from '../components/Mentol'
import { Confetti } from '../components/ui'
import { waLink } from '../game/whatsapp'
import type { SignupData } from './SignUp'

export function Offer({
  lang,
  player,
  data,
  reference,
  existing = false,
}: {
  lang: Lang
  player: Player
  data: SignupData
  reference: string
  existing?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const isTutor = player.role === 'cikgu'
  const band = BANDS.find((b) => b.id === player.band)!

  if (isTutor) {
    const msg = fill(t(S.waTutor, lang), {
      name: data.name,
      subjects: (data.teachSubjects ?? []).join(', '),
      level: t(band.label, lang),
      ref: reference,
    })
    return (
      <div className="flex flex-1 flex-col gap-4 anim-pop">
        <Confetti pieces={40} />
        <div className="flex flex-col items-center gap-2 text-center">
          <Mentol size={110} mood="cheer" bob />
          <h1 className="font-display text-[2.1rem] font-extrabold leading-tight">{t(S.offerTutorTitle, lang)}</h1>
          <p className="text-lg text-muted">{t(S.offerTutorBody, lang)}</p>
        </div>
        <p className="clay-card bg-yellow-soft p-4 text-center font-bold">{t(S.offerTutorPerks, lang)}</p>
        <p className="text-center text-muted">
          {t(S.offerRef, lang)}: <span className="font-display text-xl font-extrabold text-navy">{reference}</span>
        </p>
        {existing && <p className="text-center text-sm font-bold text-muted">{t(S.offerExisting, lang)}</p>}
        <a className="clay-btn w-full bg-yellow" href={EVENT.tutorRegisterUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={20} strokeWidth={2.5} />
          {t(S.offerTutorRegister, lang)}
        </a>
        <a className="clay-btn w-full bg-white" href={waLink(EVENT.whatsapp, msg)} target="_blank" rel="noreferrer">
          <MessageCircle size={20} strokeWidth={2.5} />
          {t(S.offerTutorWhatsapp, lang)}
        </a>
        {!eventOver() && (
          <p className="flex items-center justify-center gap-2 text-center font-bold text-muted">
            <Store size={18} strokeWidth={2.5} />
            {t(S.offerTutorBooth, lang)}
          </p>
        )}
      </div>
    )
  }

  const over = eventOver()
  const msg = fill(t(over ? S.waLearnerAfter : S.waLearner, lang), {
    code: EVENT.offerCode,
    name: player.role === 'ibubapa' && data.childName ? `${data.childName} (${data.name})` : data.name,
    level: data.level,
    subjects: data.trialSubjects.join(', '),
    ref: reference,
  })

  if (over) {
    return (
      <div className="flex flex-1 flex-col gap-4 anim-pop">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mentol size={110} mood="happy" bob />
          <h1 className="font-display text-[2.1rem] font-extrabold leading-tight">{t(S.offerEndedTitle, lang)}</h1>
        </div>
        <p className="clay-card p-5 text-center text-[1.05rem] leading-relaxed">{t(S.offerEnded, lang)}</p>
        <p className="text-center text-muted">
          {t(S.offerRef, lang)}: <span className="font-display text-xl font-extrabold text-navy">{reference}</span>
        </p>
        <a className="clay-btn w-full bg-yellow text-xl" href={waLink(EVENT.whatsapp, msg)} target="_blank" rel="noreferrer">
          <MessageCircle size={22} strokeWidth={2.5} />
          {t(S.offerEndedClaim, lang)}
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 anim-pop">
      <Confetti />
      <div className="flex items-center gap-3">
        <Mentol size={80} mood="cheer" />
        <h1 className="font-display text-[1.9rem] font-extrabold leading-tight">{t(S.offerTitle, lang)}</h1>
      </div>

      <section className="clay-card overflow-hidden">
        <div className="bg-navy px-5 py-4 text-center text-white">
          <p className="text-sm font-bold uppercase tracking-wider text-sky">{t(S.offerCodeLabel, lang)}</p>
          <p className="font-display text-[2.1rem] font-extrabold leading-tight text-yellow">{EVENT.offerCode}</p>
        </div>
        <div className="relative border-t-[3px] border-dashed border-navy px-5 py-4 text-center">
          <p className="font-display text-xl font-bold">{t(S.offerWhat, lang)}</p>
          <p className="mt-1 inline-flex rounded-full bg-yellow px-3 py-0.5 font-display font-extrabold">
            {fill(t(S.trialWorth, lang), { value: trialValue(player.band) })}
          </p>
          <p className="mt-1 text-muted">{data.trialSubjects.join(' · ')}</p>
          <p className="mt-1 font-bold">{fill(t(S.offerValid, lang), { date: t(EVENT.offerValidUntil, lang) })}</p>
          <p className="mt-3 text-sm text-muted">
            {t(S.offerRef, lang)}: <span className="font-display text-lg font-extrabold text-navy">{reference}</span>
          </p>
        </div>
      </section>

      {existing && <p className="text-center text-sm font-bold text-muted">{t(S.offerExisting, lang)}</p>}
      <a className="clay-btn w-full bg-yellow text-xl" href={waLink(EVENT.whatsapp, msg)} target="_blank" rel="noreferrer">
        <MessageCircle size={22} strokeWidth={2.5} />
        {t(S.offerClaim, lang)}
      </a>
      <button
        type="button"
        className="clay-btn w-full bg-white"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(EVENT.offerCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          } catch {
            /* clipboard blocked: the code is on screen anyway */
          }
        }}
      >
        {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
        {copied ? t(S.offerCopied, lang) : t(S.offerCopy, lang)}
      </button>
      <p className="flex items-center justify-center gap-2 text-center font-bold text-muted">
        <Store size={18} strokeWidth={2.5} />
        {t(S.offerBooth, lang)}
      </p>
    </div>
  )
}
