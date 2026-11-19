export type Lang = 'ms' | 'en'

/** A piece of text in both languages. */
export type Txt = { ms: string; en: string }

export type Role = 'pelajar' | 'ibubapa' | 'cikgu'
export type Band = 'std1_3' | 'std4_6' | 'f1_3' | 'f4_5'
export type SubjectKey = 'bm' | 'bi' | 'math' | 'sci' | 'phy' | 'chem' | 'bio'
export type Trait = 'kreatif' | 'penyayang' | 'strategik' | 'inspirasi'

export interface Question {
  id: string
  band: Band
  subject: SubjectKey
  q: Txt
  a: Txt
  correct: boolean
  fix: Txt
}

export interface StoryChoice {
  id: string
  text: Txt
  /** null = the "okay" choice: fewer XP and no personality point. */
  trait: Trait | null
  xp: number
  reaction: Txt
}

export interface StoryScene {
  id: string
  title: Txt
  situation: Txt
  choices: StoryChoice[]
}

export interface Mark {
  questionId: string
  /** What the player tapped: true = ✓ (pupil is right), false = ✗, null = ran out of time. */
  verdict: boolean | null
  ms: number
}

export interface SubjectResult {
  subject: SubjectKey
  right: number
  total: number
}

export interface PlayResult {
  storyXp: number
  semakXp: number
  totalXp: number
  personality: Trait
  traitCounts: Record<Trait, number>
  subjects: SubjectResult[]
  strongest: SubjectKey | null
  levelUp: SubjectKey[]
  rightMarks: number
  /** Today's leaderboard rank, once the server has scored the play. */
  rank?: number | null
  players?: number
}

export interface Player {
  role: Role
  band: Band
  /** Only for future tutors: subjects they would teach. */
  teachSubjects: SubjectKey[]
  nickname: string
}
