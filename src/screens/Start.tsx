import { useState } from 'react'
import { ArrowRight, Backpack, BriefcaseBusiness, Dices, Gift, Presentation, Sticker, Users } from 'lucide-react'
import type { Band, Lang, Role, SubjectKey } from '../types'
import { S, t } from '../content/strings'
import { BAND_SUBJECTS, BANDS, SUBJECT_NAMES } from '../content/subjects'
import { EVENT } from '../content/event'
import { Mentol } from '../components/Mentol'
import { NICK_MAX, NICK_MIN, cleanNicknameInput, isCleanNickname, suggestNickname } from '../game/nickname'

export function Welcome({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center anim-slide">
      <Mentol size={150} mood="cheer" bob glow={1} />
      <div>
        <p className="font-display text-lg font-bold text-muted">{t(S.welcomeKicker, lang)}</p>
        <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05]">{t(S.welcomeTitle, lang)}</h1>
      </div>
      <p className="max-w-xs text-[1.05rem] leading-relaxed text-muted">{t(S.welcomeBody, lang)}</p>
      <ul className="flex w-full flex-col gap-2 text-left">
        <li className="flex items-center gap-2.5 rounded-2xl border-[3px] border-navy bg-white px-3.5 py-2 font-display font-bold leading-snug">
          <BriefcaseBusiness size={20} strokeWidth={2.5} className="shrink-0" />
          {t(S.welcomePerkTutor, lang)}
        </li>
        <li className="flex items-center gap-2.5 rounded-2xl border-[3px] border-navy bg-white px-3.5 py-2 font-display font-bold leading-snug">
          <Gift size={20} strokeWidth={2.5} className="shrink-0" />
          {t(S.welcomePerkTrial, lang)}
        </li>
        <li className="flex items-center justify-center gap-2 font-display font-bold text-muted">
          <Sticker size={18} strokeWidth={2.5} className="shrink-0" />
          {t(S.welcomePerkAll, lang)}
        </li>
      </ul>
      <button type="button" className="clay-btn w-full bg-yellow text-xl" onClick={onStart}>
        {t(S.welcomeStart, lang)}
        <ArrowRight size={22} strokeWidth={3} />
      </button>
      <p className="text-sm font-bold tracking-wide text-muted">{EVENT.name}</p>
    </div>
  )
}

const ROLE_OPTIONS: { id: Role; icon: typeof Backpack; label: keyof typeof S; hint: keyof typeof S }[] = [
  { id: 'cikgu', icon: Presentation, label: 'roleCikgu', hint: 'roleCikguHint' },
  { id: 'pelajar', icon: Backpack, label: 'rolePelajar', hint: 'rolePelajarHint' },
  { id: 'ibubapa', icon: Users, label: 'roleIbubapa', hint: 'roleIbubapaHint' },
]

export function RolePick({ lang, onPick }: { lang: Lang; onPick: (r: Role) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4 anim-slide">
      <h1 className="font-display text-4xl font-extrabold">{t(S.roleTitle, lang)}</h1>
      {ROLE_OPTIONS.map(({ id, icon: Icon, label, hint }) => (
        <button key={id} type="button" className="clay-option flex items-center gap-4" onClick={() => onPick(id)}>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] border-navy bg-yellow">
            <Icon size={28} strokeWidth={2.5} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-2xl font-bold leading-tight">{t(S[label], lang)}</span>
            <span className="text-muted">{t(S[hint], lang)}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function LevelPick({
  lang,
  role,
  onDone,
}: {
  lang: Lang
  role: Role
  onDone: (band: Band, teach: SubjectKey[]) => void
}) {
  const [band, setBand] = useState<Band | null>(null)
  const [teach, setTeach] = useState<SubjectKey[]>([])
  const title = role === 'pelajar' ? S.levelTitlePelajar : role === 'ibubapa' ? S.levelTitleIbubapa : S.levelTitleCikgu

  const choose = (b: Band) => {
    if (role !== 'cikgu') return onDone(b, [])
    setBand(b)
    setTeach([])
  }
  const toggle = (s: SubjectKey) =>
    setTeach((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < 3 ? [...cur, s] : cur))

  return (
    <div className="flex flex-1 flex-col gap-4 anim-slide">
      <h1 className="font-display text-[2rem] font-extrabold leading-tight">{t(title, lang)}</h1>
      <div className="grid grid-cols-2 gap-3">
        {BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={band === b.id}
            className="clay-option flex min-h-24 flex-col justify-center"
            onClick={() => choose(b.id)}
          >
            <span className="font-display text-xl font-bold leading-tight">{t(b.label, lang)}</span>
            <span className="text-sm text-muted">{role === 'cikgu' ? `RM${b.price}/${lang === 'ms' ? 'jam' : 'hr'}` : t(b.hint, lang)}</span>
          </button>
        ))}
      </div>

      {role === 'cikgu' && band && (
        <div className="flex flex-col gap-3 anim-slide">
          <h2 className="font-display text-xl font-bold">{t(S.teachSubjectsTitle, lang)}</h2>
          <div className="flex flex-wrap gap-2">
            {BAND_SUBJECTS[band].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={teach.includes(s)}
                onClick={() => toggle(s)}
                className={`min-h-11 cursor-pointer rounded-full border-[3px] border-navy px-4 font-bold ${teach.includes(s) ? 'bg-yellow' : 'bg-white'}`}
              >
                {t(SUBJECT_NAMES[s], lang)}
              </button>
            ))}
          </div>
          <button type="button" className="clay-btn mt-2 w-full bg-yellow" disabled={teach.length === 0} onClick={() => onDone(band, teach)}>
            {t(S.next, lang)}
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

export function NicknamePick({ lang, initial, onDone }: { lang: Lang; initial: string; onDone: (n: string) => void }) {
  const [name, setName] = useState(initial || suggestNickname())
  const trimmed = name.trim()
  const tooShort = trimmed.length < NICK_MIN
  const bad = !tooShort && !isCleanNickname(trimmed)

  return (
    <form
      className="flex flex-1 flex-col gap-4 anim-slide"
      onSubmit={(e) => {
        e.preventDefault()
        if (!tooShort && !bad) onDone(trimmed)
      }}
    >
      <div className="flex items-center gap-3">
        <Mentol size={72} mood="happy" />
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-tight">{t(S.nickTitle, lang)}</h1>
          <p className="text-muted">{t(S.nickBody, lang)}</p>
        </div>
      </div>
      <label className="sr-only" htmlFor="nick">
        {t(S.nickTitle, lang)}
      </label>
      <input
        id="nick"
        className="field font-display text-2xl font-bold"
        value={name}
        maxLength={NICK_MAX}
        autoComplete="off"
        placeholder={t(S.nickPlaceholder, lang)}
        onChange={(e) => setName(cleanNicknameInput(e.target.value))}
        aria-invalid={bad || undefined}
        aria-describedby="nick-msg"
      />
      <p id="nick-msg" className="min-h-6 font-bold text-wrong" role="status">
        {bad ? t(S.nickBad, lang) : name && tooShort ? t(S.nickShort, lang) : ''}
      </p>
      <button type="button" className="clay-btn w-full bg-white" onClick={() => setName(suggestNickname())}>
        <Dices size={22} strokeWidth={2.5} />
        {t(S.nickSuggest, lang)}
      </button>
      <button type="submit" className="clay-btn w-full bg-yellow text-xl" disabled={tooShort || bad}>
        {t(S.nickGo, lang)}
        <ArrowRight size={22} strokeWidth={3} />
      </button>
    </form>
  )
}
