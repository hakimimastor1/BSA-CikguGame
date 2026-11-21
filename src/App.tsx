import { useEffect, useRef, useState } from 'react'
import type { Band, Game, Lang, Mark, PlayResult, Player, Question, Role, StoryChoice, SubjectKey } from './types'
import bank from './content/questions.json'
import { STORY } from './content/story'
import { STORY_B } from './content/storyB'
import { Header, PreviewBanner, Screen } from './components/ui'
import { GamePick, LevelPick, NicknamePick, RolePick, Welcome } from './screens/Start'
import { StoryIntro, StoryScene } from './screens/Story'
import { SemakIntro, SemakRound } from './screens/Semak'
import { Result } from './screens/Result'
import { SignUp, type SignupData } from './screens/SignUp'
import { Offer } from './screens/Offer'
import { fromServer, pickQuestions, scorePlay } from './game/scoring'
import { makeReference } from './game/whatsapp'
import { finishPlay, online, startPlay, submitSignup } from './lib/api'

type Step = 'welcome' | 'role' | 'gamePick' | 'level' | 'nick' | 'intro' | 'story' | 'semakIntro' | 'semak' | 'result' | 'signup' | 'offer'

const LOCAL_BANK = bank as Question[]

const readLang = (): Lang => {
  try {
    const v = localStorage.getItem('cs-lang')
    if (v === 'ms' || v === 'en') return v
  } catch {
    /* storage blocked */
  }
  return 'ms'
}

/** A play the server knows about: its id and the questions it picked. */
type ServerPlay = { playId: string; questions: Question[] }

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang)
  const [step, setStep] = useState<Step>('welcome')
  const [player, setPlayer] = useState<Player>({ role: 'pelajar', game: 'pelajar', band: 'std4_6', teachSubjects: [], nickname: '' })
  const [scene, setScene] = useState(0)
  const [picks, setPicks] = useState<StoryChoice[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<PlayResult | null>(null)
  const [marks, setMarks] = useState<Mark[]>([])
  const [signup, setSignup] = useState<SignupData | null>(null)
  const [reference, setReference] = useState('')
  const [existing, setExisting] = useState(false)

  // The server play is requested when the story starts and used if it arrives before Semak Kerja.
  const serverPlay = useRef<Promise<ServerPlay | null> | null>(null)
  const activePlayId = useRef<string | null>(null)

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

  const startGame = (p: Player) => {
    setScene(0)
    setPicks([])
    setResult(null)
    setSignup(null)
    setExisting(false)
    activePlayId.current = null
    serverPlay.current = online
      ? startPlay({ nickname: p.nickname, role: p.role, game: p.game, band: p.band, lang, teach: p.teachSubjects }).catch(() => null)
      : Promise.resolve(null)
    setStep('intro')
  }

  const toSemak = async () => {
    // Don't keep the player waiting: if the server hasn't answered within 2 s, play locally.
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), 2000))
    const sp = await Promise.race([serverPlay.current ?? Promise.resolve(null), timeout])
    if (sp && sp.questions?.length) {
      activePlayId.current = sp.playId
      setQuestions(sp.questions)
    } else {
      activePlayId.current = null
      setQuestions(pickQuestions(LOCAL_BANK, player.band, player.teachSubjects))
    }
    setStep('semakIntro')
  }

  const onSemakDone = (marks: Mark[]) => {
    setMarks(marks)
    const local = scorePlay(picks, questions, marks, player.game)
    setResult(local)
    setStep('result')
    const id = activePlayId.current
    if (id) {
      finishPlay(
        id,
        picks.map((c) => c.id),
        marks.map((m) => ({ id: m.questionId, verdict: m.verdict, ms: m.ms, hint: m.hint ?? false })),
      )
        .then((r) => setResult(fromServer(r, local)))
        .catch(() => {
          /* keep the local result; the play just won't reach the leaderboard */
        })
    }
  }

  const onSignup = async (d: SignupData) => {
    const res = await submitSignup(activePlayId.current, { ...d, role: player.role, lang })
    setSignup(d)
    setReference(res.ref)
    setExisting(res.existing)
    setStep('offer')
  }

  const onSignupSkip = (d: SignupData) => {
    setSignup(d)
    setReference(makeReference())
    setExisting(false)
    setStep('offer')
  }

  const scenes = player.game === 'pelajar' ? STORY_B : STORY
  const back: Partial<Record<Step, Step>> = { role: 'welcome', gamePick: 'role', level: player.role === 'ibubapa' ? 'gamePick' : 'role', nick: 'level' }

  return (
    <>
      {!online && <PreviewBanner lang={lang} />}
      <Screen>
        <Header lang={lang} onLang={toggleLang} onBack={back[step] ? () => setStep(back[step]!) : undefined} />

        {step === 'welcome' && <Welcome lang={lang} onStart={() => setStep('role')} />}

        {step === 'role' && (
          <RolePick
            lang={lang}
            onPick={(role: Role) => {
              // School students play Game B, future tutors Game A; families choose.
              const game: Game = role === 'pelajar' ? 'pelajar' : 'cikgu'
              setPlayer((p) => ({ ...p, role, game }))
              setStep(role === 'ibubapa' ? 'gamePick' : 'level')
            }}
          />
        )}

        {step === 'gamePick' && (
          <GamePick
            lang={lang}
            onPick={(game: Game) => {
              setPlayer((p) => ({ ...p, game }))
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
              const p = { ...player, nickname }
              setPlayer(p)
              startGame(p)
            }}
          />
        )}

        {step === 'intro' && <StoryIntro lang={lang} role={player.role} game={player.game} onStart={() => setStep('story')} />}

        {step === 'story' && (
          <StoryScene
            key={scene}
            lang={lang}
            scenes={scenes}
            index={scene}
            xp={storyXp}
            onPicked={(c) => setPicks((p) => [...p, c])}
            onNext={() => {
              if (scene + 1 < scenes.length) setScene(scene + 1)
              else void toSemak()
            }}
          />
        )}

        {step === 'semakIntro' && <SemakIntro lang={lang} game={player.game} onStart={() => setStep('semak')} />}

        {step === 'semak' && <SemakRound lang={lang} game={player.game} questions={questions} onDone={onSemakDone} />}

        {step === 'result' && result && (
          <Result
            lang={lang}
            player={player}
            result={result}
            questions={questions}
            marks={marks}
            onClaim={() => setStep('signup')}
            onAgain={() => startGame(player)}
          />
        )}

        {step === 'signup' && result && (
          <SignUp lang={lang} player={player} result={result} onSubmit={online ? onSignup : async (d) => onSignupSkip(d)} onSkip={onSignupSkip} />
        )}

        {step === 'offer' && signup && <Offer lang={lang} player={player} data={signup} reference={reference} existing={existing} />}
      </Screen>
    </>
  )
}
