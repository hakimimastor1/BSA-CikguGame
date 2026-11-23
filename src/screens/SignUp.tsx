import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, LoaderCircle, RotateCcw, WifiOff } from 'lucide-react'
import type { Band, Lang, PlayResult, Player, Txt } from '../types'
import { S, fill, t } from '../content/strings'
import { NEXT_YEAR, eventOver } from '../content/event'
import { BSA_SUBJECTS, NEXT_LEVELS, NOW_LEVELS_BY_BAND, SUBJECT_TO_BSA, levelById, nextLevelId, trialValue } from '../content/subjects'
import { normaliseMyPhone } from '../game/whatsapp'

export interface SignupData {
  name: string
  /** The number BSA follows up on (a parent's for under-18 students). */
  whatsapp: string
  parentName?: string
  under18?: boolean
  childName?: string
  /** This year's level (BM label, e.g. "Tahun 4"). */
  level: string
  /** Next year's class (BM label, e.g. "Tahun 5"): the trial and classes are for that year. */
  levelNext?: string
  /** Band of next year's class, for the trial value on the offer screen. */
  levelNextBand?: Band
  school?: string
  area?: string
  trialSubjects: string[]
  tutorStatus?: 'upsi' | 'grad'
  semester?: string
  cgpa?: string
  qualification?: string
  course?: string
  teachSubjects?: string[]
  availability?: string[]
  consent: boolean
  marketing: boolean
}

const AVAIL: { id: string; label: Txt }[] = [
  { id: 'weekday', label: S.avWeekday },
  { id: 'weekend', label: S.avWeekend },
  { id: 'flexible', label: S.avFlexible },
]

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-bold">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted">{hint}</span>}
      {error && (
        <span className="text-sm font-bold text-wrong" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

function Chips({
  options,
  value,
  max,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string[]
  max?: number
  onChange: (v: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : max && value.length >= max ? value : [...value, o.id])}
            className={`min-h-11 cursor-pointer rounded-full border-[3px] border-navy px-3.5 text-[0.95rem] font-bold ${on ? 'bg-yellow' : 'bg-white'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function SignUp({
  lang,
  player,
  result,
  onSubmit,
  onSkip,
}: {
  lang: Lang
  player: Player
  result: PlayResult
  /** Saves the sign-up; rejects when it couldn't be saved. */
  onSubmit: (d: SignupData) => Promise<void>
  /** Carry on without saving (weak signal): the WhatsApp message still reaches BSA. */
  onSkip: (d: SignupData) => void
}) {
  const role = player.role
  const isTutor = role === 'cikgu'
  // Learners: this year's level and next year's class (the trial is for next year). Tutors: the band they teach.
  const nowLevels = NOW_LEVELS_BY_BAND[player.band]
  const [nowId, setNowId] = useState(nowLevels[0])
  const [nextId, setNextId] = useState(nextLevelId(nowLevels[0]))
  const trialBand = levelById(nextId).band
  const subjectOptions = BSA_SUBJECTS[player.band].map((s) => ({ id: s, label: s }))
  const trialOptions = BSA_SUBJECTS[trialBand].map((s) => ({ id: s, label: s }))

  /** Suggested trial subjects: the ones the player found hardest, if next year's class offers them. */
  const presetFor = (band: Band) => {
    const fromGame = [...result.levelUp, ...(result.strongest ? [result.strongest] : []), ...result.subjects.map((s) => s.subject)].map(
      (s) => SUBJECT_TO_BSA[s],
    )
    return [...new Set(fromGame)].filter((s) => BSA_SUBJECTS[band].includes(s)).slice(0, 3)
  }
  const presetTrial = useMemo(() => presetFor(levelById(nextLevelId(nowLevels[0])).band), [result]) // eslint-disable-line react-hooks/exhaustive-deps

  const [d, setD] = useState<SignupData>({
    name: '',
    whatsapp: '',
    parentName: '',
    under18: role === 'pelajar',
    childName: '',
    level: levelById(nowLevels[0]).label.ms,
    levelNext: levelById(nextLevelId(nowLevels[0])).label.ms,
    levelNextBand: levelById(nextLevelId(nowLevels[0])).band,
    school: '',
    area: '',
    trialSubjects: presetTrial,
    tutorStatus: 'upsi',
    semester: '',
    cgpa: '',
    qualification: '',
    course: '',
    teachSubjects: player.teachSubjects.map((s) => SUBJECT_TO_BSA[s]),
    availability: [],
    consent: false,
    marketing: false,
  })
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const set = <K extends keyof SignupData>(k: K, v: SignupData[K]) => setD((cur) => ({ ...cur, [k]: v }))
  /** Next year's class decides the trial subjects on offer: keep the picks that still exist, else suggest again. */
  const pickNext = (id: string) => {
    const band = levelById(id).band
    setNextId(id)
    setD((cur) => {
      const kept = cur.trialSubjects.filter((x) => BSA_SUBJECTS[band].includes(x))
      return { ...cur, levelNext: levelById(id).label.ms, levelNextBand: band, trialSubjects: kept.length ? kept : presetFor(band) }
    })
  }

  const needsParent = role === 'pelajar' && d.under18
  const errors: Partial<Record<keyof SignupData, string>> = {}
  if (!d.name.trim()) errors.name = t(S.fRequired, lang)
  if (!normaliseMyPhone(d.whatsapp)) errors.whatsapp = t(S.fPhoneInvalid, lang)
  if (!isTutor && d.trialSubjects.length !== 3) errors.trialSubjects = t(S.fPick3, lang)
  if (isTutor && !(d.teachSubjects?.length ?? 0)) errors.teachSubjects = t(S.fPickAtLeast1, lang)
  if (!d.consent) errors.consent = t(S.fConsentNeeded, lang)
  const ok = Object.keys(errors).length === 0
  const err = (k: keyof SignupData) => (tried ? errors[k] : undefined)

  const nameLabel = role === 'ibubapa' ? t(S.fYourName, lang) : t(S.fName, lang)
  const phoneLabel = needsParent ? t(S.fParentWhatsapp, lang) : t(S.fWhatsapp, lang)

  return (
    <form
      noValidate
      className="flex flex-col gap-4 anim-slide"
      onSubmit={async (e) => {
        e.preventDefault()
        setTried(true)
        if (!ok || saving) return
        setSaving(true)
        setFailed(false)
        try {
          await onSubmit({ ...d, whatsapp: normaliseMyPhone(d.whatsapp)! })
        } catch {
          setFailed(true)
          setSaving(false)
        }
      }}
    >
      <div>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight">
          {isTutor ? t(S.signupTitleTutor, lang) : t(S.signupTitleLearner, lang)}
        </h1>
        <p className="mt-1 text-muted">{isTutor ? t(S.signupBodyTutor, lang) : t(S.signupBodyLearner, lang)}</p>
        {!isTutor && !eventOver() && (
          <p className="mt-2 inline-flex rounded-full border-[3px] border-navy bg-yellow px-3 py-0.5 font-display font-extrabold">
            {t(S.offerWhat, lang).split(' · ')[0]} · {fill(t(S.trialWorth, lang), { value: trialValue(trialBand) })}
          </p>
        )}
      </div>

      <div className="clay-card flex flex-col gap-4 p-5">
        <Field label={nameLabel} error={err('name')}>
          <input className="field" autoComplete="name" value={d.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        {role === 'pelajar' && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 font-bold">
            <input type="checkbox" className="h-6 w-6 accent-[#023E86]" checked={!!d.under18} onChange={(e) => set('under18', e.target.checked)} />
            {t(S.fUnder18, lang)}
          </label>
        )}
        {needsParent && (
          <Field label={t(S.fParentName, lang)}>
            <input className="field" value={d.parentName} onChange={(e) => set('parentName', e.target.value)} />
          </Field>
        )}

        <Field label={phoneLabel} error={err('whatsapp')} hint={needsParent ? t(S.fParentWhatsappHint, lang) : undefined}>
          <input
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-345 6789"
            value={d.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
          />
        </Field>

        {role === 'ibubapa' && (
          <Field label={t(S.fNameChild, lang)}>
            <input className="field" value={d.childName} onChange={(e) => set('childName', e.target.value)} />
          </Field>
        )}

        {!isTutor && (
          <>
            <Field label={fill(t(role === 'ibubapa' ? S.fChildLevelNow : S.fLevelNow, lang), { year: NEXT_YEAR - 1 })}>
              <select
                className="field"
                value={nowId}
                onChange={(e) => {
                  const now = e.target.value
                  setNowId(now)
                  set('level', levelById(now).label.ms)
                  pickNext(nextLevelId(now))
                }}
              >
                {nowLevels.map((id) => (
                  <option key={id} value={id}>
                    {t(levelById(id).label, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={fill(t(role === 'ibubapa' ? S.fChildLevelNext : S.fLevelNext, lang), { year: NEXT_YEAR })}
              hint={fill(t(S.fLevelNextHint, lang), { year: NEXT_YEAR })}
            >
              <select className="field" value={nextId} onChange={(e) => pickNext(e.target.value)}>
                {NEXT_LEVELS.map((id) => (
                  <option key={id} value={id}>
                    {t(levelById(id).label, lang)}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {!isTutor && (
          <Field label={role === 'ibubapa' ? t(S.fChildSchool, lang) : t(S.fSchool, lang)}>
            <input className="field" value={d.school} onChange={(e) => set('school', e.target.value)} />
          </Field>
        )}

        {isTutor && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-bold">{t(S.fStatus, lang)}</legend>
              <Chips
                options={[
                  { id: 'upsi', label: t(S.fStatusUpsi, lang) },
                  { id: 'grad', label: t(S.fStatusGrad, lang) },
                ]}
                value={[d.tutorStatus!]}
                onChange={(v) => set('tutorStatus', (v.find((x) => x !== d.tutorStatus) ?? d.tutorStatus) as 'upsi' | 'grad')}
              />
            </fieldset>
            {d.tutorStatus === 'upsi' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t(S.fSemester, lang)}>
                  <input className="field" inputMode="numeric" value={d.semester} onChange={(e) => set('semester', e.target.value.replace(/\D/g, '').slice(0, 2))} />
                </Field>
                <Field label={t(S.fCgpa, lang)}>
                  <input className="field" inputMode="decimal" placeholder="3.50" value={d.cgpa} onChange={(e) => set('cgpa', e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} />
                </Field>
              </div>
            ) : (
              <Field label={t(S.fQualification, lang)}>
                <input className="field" value={d.qualification} onChange={(e) => set('qualification', e.target.value)} />
              </Field>
            )}
            <Field label={t(S.fCourse, lang)}>
              <input className="field" value={d.course} onChange={(e) => set('course', e.target.value)} />
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-bold">{t(S.fTeachSubjects, lang)}</legend>
              <Chips options={subjectOptions} value={d.teachSubjects ?? []} onChange={(v) => set('teachSubjects', v)} />
              {err('teachSubjects') && <span className="text-sm font-bold text-wrong">{err('teachSubjects')}</span>}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-bold">{t(S.fAvailability, lang)}</legend>
              <Chips options={AVAIL.map((a) => ({ id: a.id, label: t(a.label, lang) }))} value={d.availability ?? []} onChange={(v) => set('availability', v)} />
            </fieldset>
          </>
        )}

        {role !== 'pelajar' && (
          <Field label={t(S.fArea, lang)}>
            <input className="field" autoComplete="address-level2" value={d.area} onChange={(e) => set('area', e.target.value)} />
          </Field>
        )}

        {!isTutor && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">
              {t(S.fTrialSubjects, lang)} <span className="tabular-nums text-muted">({d.trialSubjects.length}/3)</span>
            </legend>
            <span className="text-sm text-muted">{t(S.fTrialSubjectsHint, lang)}</span>
            <Chips options={trialOptions} value={d.trialSubjects} max={3} onChange={(v) => set('trialSubjects', v)} />
            {err('trialSubjects') && <span className="text-sm font-bold text-wrong">{err('trialSubjects')}</span>}
          </fieldset>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] leading-snug">
          <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[#023E86]" checked={d.consent} onChange={(e) => set('consent', e.target.checked)} />
          <span>{t(S.fConsent, lang)}</span>
        </label>
        {err('consent') && <span className="text-sm font-bold text-wrong">{err('consent')}</span>}
        <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] leading-snug">
          <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[#023E86]" checked={d.marketing} onChange={(e) => set('marketing', e.target.checked)} />
          <span>{t(S.fMarketing, lang)}</span>
        </label>
      </div>

      {failed && (
        <div className="clay-card flex flex-col gap-3 bg-wrong-soft p-4" role="alert">
          <p className="flex items-start gap-2 font-bold">
            <WifiOff size={20} strokeWidth={2.5} className="mt-0.5 shrink-0" />
            {t(S.signupError, lang)}
          </p>
          <button type="button" className="clay-btn w-full bg-white" onClick={() => onSkip({ ...d, whatsapp: normaliseMyPhone(d.whatsapp)! })}>
            {t(S.signupSkip, lang)}
          </button>
        </div>
      )}

      <button type="submit" className="clay-btn w-full bg-yellow text-xl" disabled={saving}>
        {saving ? (
          <>
            <LoaderCircle size={22} strokeWidth={3} className="animate-spin" />
            {t(S.signupSaving, lang)}
          </>
        ) : failed ? (
          <>
            <RotateCcw size={20} strokeWidth={3} />
            {t(S.signupRetry, lang)}
          </>
        ) : (
          <>
            {isTutor ? t(S.submitTutor, lang) : t(S.submitLearner, lang)}
            <ArrowRight size={22} strokeWidth={3} />
          </>
        )}
      </button>
    </form>
  )
}
