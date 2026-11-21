import { Check, ChevronDown, Clock, Lightbulb, Sparkles, X } from 'lucide-react'
import type { Game, Lang, Mark, PlayResult, Question } from '../types'
import { S, t } from '../content/strings'
import { STUDY_TIPS, SUBJECT_NAMES } from '../content/subjects'
import { STYLE_TIPS } from '../content/storyB'

/** Marks per subject and a study tip for each weak one, for students to show their parents. */
export function MiniReport({ lang, result, game = 'cikgu' }: { lang: Lang; result: PlayResult; game?: Game }) {
  const weak = result.levelUp.slice(0, 2)
  const styleTips = game === 'pelajar' ? STYLE_TIPS[result.personality as keyof typeof STYLE_TIPS] : undefined
  return (
    <section className="clay-card p-4 anim-slide" aria-labelledby="report-h">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h2 id="report-h" className="whitespace-nowrap font-display text-xl font-extrabold">
          {t(S.reportTitle, lang)}
        </h2>
        <span className="text-sm font-bold text-muted">{t(S.reportBody, lang)}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {result.subjects.map((s) => (
          <li key={s.subject} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <span className="font-bold">{t(SUBJECT_NAMES[s.subject], lang)}</span>
            <span className="font-display text-lg font-extrabold tabular-nums">
              {s.right}/{s.total}
            </span>
            <span className="col-span-2 h-2.5 overflow-hidden rounded-full border-2 border-navy bg-white" aria-hidden="true">
              <span
                className={`block h-full ${s.right === s.total ? 'bg-correct' : s.right === 0 ? 'bg-wrong' : 'bg-yellow'}`}
                style={{ width: `${(s.right / s.total) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
      {styleTips && (
        <div className="mt-3 rounded-2xl bg-sky p-3">
          <p className="flex items-center gap-1.5 font-display font-bold">
            <Sparkles size={18} strokeWidth={2.5} />
            {t(S.styleTipsTitle, lang)}
          </p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-[0.95rem] leading-snug">
            {styleTips.map((tip, i) => (
              <li key={i}>{t(tip, lang)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 rounded-2xl bg-yellow-soft p-3">
        <p className="flex items-center gap-1.5 font-display font-bold">
          <Lightbulb size={18} strokeWidth={2.5} />
          {t(S.reportTips, lang)}
        </p>
        {weak.length ? (
          <ul className="mt-1 flex flex-col gap-1.5 text-[0.95rem] leading-snug">
            {weak.map((s) => (
              <li key={s}>
                <b>{t(SUBJECT_NAMES[s], lang)}:</b> {t(STUDY_TIPS[s], lang)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[0.95rem]">{t(S.reportAllRight, lang)}</p>
        )}
      </div>
    </section>
  )
}

/** All 8 Semak Kerja items with the right answer, so the round teaches something. */
export function AnswerReview({ lang, questions, marks, game = 'cikgu' }: { lang: Lang; questions: Question[]; marks: Mark[]; game?: Game }) {
  const quiz = game === 'pelajar'
  return (
    <details className="clay-card group p-4 anim-slide">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-display text-xl font-extrabold">
        {t(S.reviewTitle, lang)} ({questions.length})
        <ChevronDown size={22} strokeWidth={3} className="transition-transform group-open:rotate-180" />
      </summary>
      <ol className="mt-3 flex flex-col gap-3">
        {questions.map((q, i) => {
          const m = marks.find((x) => x.questionId === q.id)
          const status = !m || m.verdict === null ? 'none' : m.verdict === q.correct && m.ms >= 250 ? 'right' : 'wrong'
          return (
            <li key={q.id} className="rounded-2xl border-2 border-sky p-3">
              <p className="text-sm font-bold text-muted">
                {i + 1}. {t(SUBJECT_NAMES[q.subject], lang)}
              </p>
              <p className="font-bold leading-snug">{t(q.q, lang)}</p>
              <p className="mt-1 text-[0.95rem]">
                {t(quiz ? S.reviewAnswer : S.reviewPupil, lang)}: <b>{t(q.a, lang)}</b>
              </p>
              <p className="text-[0.95rem]">
                {q.correct ? t(quiz ? S.reviewAnswerRight : S.reviewPupilRight, lang) : `${t(S.reviewCorrect, lang)}: `}
                {!q.correct && <b className="text-correct">{t(q.fix, lang)}</b>}
              </p>
              <p
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${
                  status === 'right' ? 'bg-correct-soft text-correct' : status === 'wrong' ? 'bg-wrong-soft text-wrong' : 'bg-sky text-muted'
                }`}
              >
                {status === 'right' ? <Check size={15} strokeWidth={3} /> : status === 'wrong' ? <X size={15} strokeWidth={3} /> : <Clock size={15} strokeWidth={3} />}
                {status === 'right'
                  ? t(quiz ? S.reviewYouAnsweredRight : S.reviewYouRight, lang)
                  : status === 'wrong'
                    ? t(quiz ? S.reviewYouAnsweredWrong : S.reviewYouWrong, lang)
                    : t(S.reviewNoTime, lang)}
                {m?.hint ? ` (${t(S.reviewHinted, lang)})` : ''}
              </p>
            </li>
          )
        })}
      </ol>
    </details>
  )
}
