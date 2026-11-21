import { useState } from 'react'
import { ArrowRight, Lightbulb } from 'lucide-react'
import type { Game, Lang, Role, StoryChoice, StoryScene as Scene } from '../types'
import { S, fill, t } from '../content/strings'
import { introFor } from '../content/story'
import { INTRO_B } from '../content/storyB'
import { Mentol } from '../components/Mentol'
import { Progress, XpPill } from '../components/ui'

export function StoryIntro({ lang, role, game, onStart }: { lang: Lang; role: Role; game: Game; onStart: () => void }) {
  const intro = game === 'pelajar' ? INTRO_B : introFor(role)
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center anim-pop">
      <Mentol size={130} mood="wow" bob />
      <h1 className="font-display text-[2.1rem] font-extrabold leading-tight">{t(intro.title, lang)}</h1>
      <p className="max-w-xs text-lg text-muted">{t(intro.body, lang)}</p>
      <button type="button" className="clay-btn w-full bg-yellow text-xl" onClick={onStart}>
        {t(S.welcomeStart, lang)}
        <ArrowRight size={22} strokeWidth={3} />
      </button>
    </div>
  )
}

export function StoryScene({
  lang,
  scenes,
  index,
  xp,
  onPicked,
  onNext,
}: {
  lang: Lang
  scenes: Scene[]
  index: number
  xp: number
  onPicked: (c: StoryChoice) => void
  onNext: () => void
}) {
  const scene = scenes[index]
  const [picked, setPicked] = useState<StoryChoice | null>(null)
  const good = picked?.trait != null
  // Five options must still fit on a small phone without scrolling.
  const compact = scene.choices.length > 4

  return (
    <div key={scene.id} className="flex flex-1 flex-col gap-4 anim-slide">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold text-muted">
          {fill(t(S.sceneOf, lang), { n: index + 1, total: scenes.length })}
        </span>
        <XpPill xp={xp} />
      </div>
      <Progress step={index + (picked ? 1 : 0)} total={scenes.length} />

      <section className="clay-card relative p-5 pr-24">
        <h1 className="font-display text-2xl font-extrabold leading-tight">{t(scene.title, lang)}</h1>
        <p className="mt-2 text-[1.05rem] leading-relaxed">{t(scene.situation, lang)}</p>
        <div className="absolute -right-2 -top-6">
          <Mentol size={88} mood={picked ? (good ? 'cheer' : 'oops') : 'think'} />
        </div>
      </section>

      {!picked ? (
        <div className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}>
          {scene.choices.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className="clay-option flex items-center gap-3 anim-slide"
              style={{ animationDelay: `${i * 60}ms`, paddingBlock: compact ? '0.55rem' : undefined }}
              onClick={() => {
                setPicked(c)
                onPicked(c)
              }}
            >
              <span className={`flex shrink-0 items-center justify-center rounded-full border-[3px] border-navy bg-sky font-display font-extrabold ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`font-bold leading-snug ${compact ? 'text-base' : 'text-[1.05rem]'}`}>{t(c.text, lang)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 anim-pop">
          <div className={`clay-card p-5 ${good ? 'bg-yellow-soft' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold">
                <Lightbulb size={20} strokeWidth={2.5} />
                {t(S.tipCikgu, lang)}
              </span>
              <span className="font-display text-2xl font-extrabold">{fill(t(S.xpGained, lang), { xp: picked.xp })}</span>
            </div>
            <p className="mt-2 text-[1.05rem] leading-relaxed">{t(picked.reaction, lang)}</p>
          </div>
          <button type="button" className="clay-btn w-full bg-yellow" onClick={onNext} autoFocus>
            {t(S.continue, lang)}
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}
