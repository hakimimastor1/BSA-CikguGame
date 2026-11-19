import { useEffect, useState } from 'react'
import type { Band, Lang, Mark, PlayResult, Player, Question, Role, StoryChoice, SubjectKey } from './types'
import bank from './content/questions.json'
import { STORY } from './content/story'
import { Header, PreviewBanner, Screen } from './components/ui'
import { LevelPick, NicknamePick, RolePick, Welcome } from './screens/Start'
import { StoryIntro, StoryScene } from './screens/Story'
import { SemakIntro, SemakRound } from './screens/Semak'
import { Result } from './screens/Result'
import { SignUp, type SignupData } from './screens/SignUp'
import { Offer } from './screens/Offer'
import { pickQuestions, scorePlay } from './game/scoring'
import { makeReference } from './game/whatsapp'

type Step = 'welcome' | 'role' | 'level' | 'nick' | 'intro' | 'story' | 'semakIntro' | 'semak' | 'result' | 'signup' | 'offer'

const QUESTIONS = bank as Question[]

const readLang = (): Lang => {
  try {
    const v = localStorage.getItem('cs-lang')
    if (v === 'ms' || v === 'en') return v
  } catch {
    /* storage blocked */
  }
  return 'ms'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang)
  const [step, setStep] = useState<Step>('welcome')
  const [player, setPlayer] = useState<Player>({ role: 'pelajar', band: 'std4_6', teachSubjects: [], nickname: '' })
  const [scene, setScene] = useState(0)
  const [picks, setPicks] = useState<StoryChoice[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<PlayResult | null>(null)
  const [signup, setSignup] = useState<SignupData | null>(null)
  const [reference, setReference] = useState('')

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('cs-lang', lang)
    } catch {
      /* storage blocked */
    }
  }, [lang])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step, scene])

  const toggleLang = () => setLang((l) => (l === 'ms' ? 'en' : 'ms'))
  const storyXp = picks.reduce((s, c) => s + c.xp, 0)

  const startPlay = () => {
    setScene(0)
    setPicks([])
    setResult(null)
    setSignup(null)
    setStep('intro')
  }

  const back: Partial<Record<Step, Step>> = { role: 'welcome', level: 'role', nick: 'level' }

  return (
    <>
      <PreviewBanner lang={lang} />
      <Screen>
        <Header lang={lang} onLang={toggleLang} onBack={back[step] ? () => setStep(back[step]!) : undefined} />

        {step === 'welcome' && <Welcome lang={lang} onStart={() => setStep('role')} />}

        {step === 'role' && (
          <RolePick
            lang={lang}
            onPick={(role: Role) => {
              setPlayer((p) => ({ ...p, role }))
              setStep('level')
            }}
          />
        )}

        {step === 'level' && (
          <LevelPick
            lang={lang}
            role={player.role}
            onDone={(band: Band, teachSubjects: SubjectKey[]) => {
              setPlayer((p) => ({ ...p, band, teachSubjects }))
              setStep('nick')
            }}
          />
        )}

        {step === 'nick' && (
          <NicknamePick
            lang={lang}
            initial={player.nickname}
            onDone={(nickname) => {
              setPlayer((p) => ({ ...p, nickname }))
              startPlay()
            }}
          />
        )}

        {step === 'intro' && <StoryIntro lang={lang} role={player.role} onStart={() => setStep('story')} />}

        {step === 'story' && (
          <StoryScene
            key={scene}
            lang={lang}
            index={scene}
            xp={storyXp}
            onPicked={(c) => setPicks((p) => [...p, c])}
            onNext={() => {
              if (scene + 1 < STORY.length) setScene(scene + 1)
              else {
                setQuestions(pickQuestions(QUESTIONS, player.band, player.teachSubjects))
                setStep('semakIntro')
              }
            }}
          />
        )}

        {step === 'semakIntro' && <SemakIntro lang={lang} onStart={() => setStep('semak')} />}

        {step === 'semak' && (
          <SemakRound
            lang={lang}
            questions={questions}
            onDone={(marks: Mark[]) => {
              setResult(scorePlay(picks, questions, marks))
              setStep('result')
            }}
          />
        )}

        {step === 'result' && result && (
          <Result lang={lang} player={player} result={result} onClaim={() => setStep('signup')} onAgain={startPlay} />
        )}

        {step === 'signup' && result && (
          <SignUp
            lang={lang}
            player={player}
            result={result}
            onDone={(d) => {
              setSignup(d)
              setReference(makeReference())
              setStep('offer')
            }}
          />
        )}

        {step === 'offer' && signup && <Offer lang={lang} player={player} data={signup} reference={reference} />}
      </Screen>
    </>
  )
}
