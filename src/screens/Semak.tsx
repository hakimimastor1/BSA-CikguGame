import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Flame, Timer, X } from 'lucide-react'
import type { Lang, Mark, Question } from '../types'
import { S, fill, t } from '../content/strings'
import { SUBJECT_NAMES } from '../content/subjects'
import { Mentol } from '../components/Mentol'
import { SEMAK_SECONDS, markXp } from '../game/scoring'

export function SemakIntro({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center anim-pop">
      <Mentol size={120} mood="wow" bob />
      <h1 className="font-display text-[2.2rem] font-extrabold leading-tight">{t(S.semakTitle, lang)}</h1>
      <p className="max-w-xs text-lg text-muted">{t(S.semakBody, lang)}</p>
      <div className="flex gap-3" aria-hidden="true">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-navy bg-wrong-soft text-wrong">
          <X size={36} strokeWidth={4} />
        </span>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-navy bg-correct-soft text-correct">
          <Check size={36} strokeWidth={4} />
        </span>
      </div>
      <p className="inline-flex items-center gap-2 font-display text-lg font-bold">
        <Timer size={20} strokeWidth={2.5} />
        {fill(t(S.semakSeconds, lang), { s: SEMAK_SECONDS })}
      </p>
      <button type="button" className="clay-btn w-full bg-yellow text-xl" onClick={onStart}>
        {t(S.semakStart, lang)}
        <ArrowRight size={22} strokeWidth={3} />
      </button>
    </div>
  )
}

type Feedback = { right: boolean; xp: number; q: Question } | null

export function SemakRound({
  lang,
  questions,
  onDone,
}: {
  lang: Lang
  questions: Question[]
  onDone: (marks: Mark[]) => void
}) {
  const [idx, setIdx] = useState(0)
  const [marks, setMarks] = useState<Mark[]>([])
  const [left, setLeft] = useState(SEMAK_SECONDS * 1000)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [finished, setFinished] = useState<'done' | 'timeup' | null>(null)
  const shownAt = useRef(performance.now())
  const marksRef = useRef<Mark[]>([])
  marksRef.current = marks

  // Countdown, paused while feedback is showing.
  useEffect(() => {
    if (feedback || finished) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      setLeft((l) => Math.max(0, l - (now - last)))
      last = now
    }, 100)
    return () => window.clearInterval(id)
  }, [feedback, finished])

  useEffect(() => {
    if (left <= 0 && !finished) setFinished('timeup')
  }, [left, finished])

  const q = questions[idx]

  const answer = useCallback(
    (verdict: boolean) => {
      if (!q || feedback || finished) return
      const ms = Math.round(performance.now() - shownAt.current)
      const right = verdict === q.correct
      const gained = markXp(right, ms, streak)
      setMarks((m) => [...m, { questionId: q.id, verdict, ms }])
      setXp((x) => x + gained)
      setStreak((s) => (right ? s + 1 : 0))
      setFeedback({ right, xp: gained, q })
      if (navigator.vibrate) navigator.vibrate(right ? 30 : [40, 40, 40])
      window.setTimeout(
        () => {
          setFeedback(null)
          if (idx + 1 >= questions.length) setFinished('done')
          else {
            setIdx(idx + 1)
            shownAt.current = performance.now()
          }
        },
        right ? 650 : 1500,
      )
    },
    [q, feedback, finished, streak, idx, questions.length],
  )

  const rightCount = marks.filter((m) => questions.find((x) => x.id === m.questionId)?.correct === m.verdict).length

  if (finished) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center anim-pop">
        <Mentol size={120} mood={rightCount >= questions.length / 2 ? 'cheer' : 'happy'} />
        <h1 className="font-display text-[2.2rem] font-extrabold">
          {finished === 'timeup' ? t(S.semakTimeUp, lang) : t(S.semakDone, lang)}
        </h1>
        <p className="font-display text-2xl font-bold">
          {fill(t(S.semakCorrectMarks, lang), { n: rightCount, total: questions.length })}
        </p>
        <p className="font-display text-3xl font-extrabold">+{xp} XP</p>
        <button type="button" className="clay-btn w-full bg-yellow text-xl" onClick={() => onDone(marksRef.current)} autoFocus>
          {t(S.semakSeeResult, lang)}
          <ArrowRight size={22} strokeWidth={3} />
        </button>
      </div>
    )
  }

  const pct = (left / (SEMAK_SECONDS * 1000)) * 100
  const urgent = left < 10000

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between font-display text-lg font-bold">
        <span>{fill(t(S.semakItem, lang), { n: idx + 1, total: questions.length })}</span>
        {streak >= 2 && (
          <span className="inline-flex items-center gap-1 text-[#B45309] anim-pop" key={streak}>
            <Flame size={20} strokeWidth={2.5} />
            {fill(t(S.semakStreak, lang), { n: streak })}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 tabular-nums ${urgent ? 'text-wrong' : ''}`}>
          <Timer size={20} strokeWidth={2.5} />
          {Math.ceil(left / 1000)}
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full border-[3px] border-navy bg-white" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${urgent ? 'bg-wrong' : 'bg-yellow'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {q && (
        <section
          key={q.id}
          className={`clay-card relative overflow-hidden anim-slide ${feedback && !feedback.right ? 'anim-shake' : ''}`}
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 2.6rem, #f3b6b0 2.6rem, #f3b6b0 calc(2.6rem + 2px), transparent calc(2.6rem + 2px)), repeating-linear-gradient(#fff 0 1.9rem, #dbe7fb 1.9rem calc(1.9rem + 2px))',
          }}
        >
          <div className="py-5 pl-14 pr-5">
            <span className="inline-block rounded-full border-2 border-navy bg-sky px-3 py-0.5 text-sm font-bold">
              {t(SUBJECT_NAMES[q.subject], lang)}
            </span>
            <p className="mt-3 font-display text-[1.45rem] font-bold leading-snug">{t(q.q, lang)}</p>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">{t(S.semakPupilAnswer, lang)}</p>
            <p className="font-display text-[1.7rem] font-extrabold leading-tight text-[#1d4ed8]">{t(q.a, lang)}</p>
          </div>

          {feedback && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center anim-pop ${feedback.right ? 'bg-correct-soft' : 'bg-wrong-soft'}`}
              role="status"
            >
              {feedback.right ? (
                <>
                  <Check size={56} strokeWidth={4} className="text-correct" />
                  <p className="font-display text-3xl font-extrabold text-correct">+{feedback.xp} XP</p>
                </>
              ) : (
                <>
                  <X size={56} strokeWidth={4} className="text-wrong" />
                  <p className="font-display text-xl font-bold text-navy">
                    {feedback.q.correct
                      ? lang === 'ms'
                        ? 'Jawapan murid sebenarnya betul!'
                        : "The pupil's answer was actually right!"
                      : `${lang === 'ms' ? 'Jawapan sebenar' : 'Correct answer'}: ${t(feedback.q.fix, lang)}`}
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          className="clay-btn min-h-24 flex-col bg-wrong-soft text-wrong"
          onClick={() => answer(false)}
          disabled={!!feedback}
          aria-label={t(S.semakWrong, lang)}
        >
          <X size={44} strokeWidth={4} />
          <span className="text-navy">{t(S.semakWrong, lang)}</span>
        </button>
        <button
          type="button"
          className="clay-btn min-h-24 flex-col bg-correct-soft text-correct"
          onClick={() => answer(true)}
          disabled={!!feedback}
          aria-label={t(S.semakRight, lang)}
        >
          <Check size={44} strokeWidth={4} />
          <span className="text-navy">{t(S.semakRight, lang)}</span>
        </button>
      </div>
    </div>
  )
}
