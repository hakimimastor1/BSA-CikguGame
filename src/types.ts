export type Lang = 'ms' | 'en'

/** A piece of text in both languages. */
export type Txt = { ms: string; en: string }

export type Role = 'pelajar' | 'ibubapa' | 'cikgu'
export type Band = 'std1_3' | 'std4_6' | 'f1_3' | 'f4_5'
export type SubjectKey = 'bm' | 'bi' | 'math' | 'sci' | 'phy' | 'chem' | 'bio'
/** Game A (cikgu) traits, then Game B (pelajar) learner types. */
export type Trait =
  | 'kreatif'
  | 'penyayang'
  | 'strategik'
  | 'inspirasi'
  | 'disiplin'
  | 'visual'
  | 'pendengar'
  | 'aktif'
  | 'pemikir'
  | 'sosial'

/** Game A = Cikgu Sehari (play the teacher); Game B = Misi Pelajar Bijak (play the student). */
export type Game = 'cikgu' | 'pelajar'

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
  /** Game B: the player used "Tanya Cikgu BSA" on this item (a right answer then scores 10 XP). */
  hint?: boolean
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
  /** Rank on this game's board, once the server has scored the play. */
  rank?: number | null
  players?: number
  /** 'manual': the board runs until an admin resets it; 'daily': it starts fresh every midnight. */
  boardMode?: 'manual' | 'daily'
}

export interface Player {
  role: Role
  game: Game
  band: Band
  /** Only for future tutors: subjects they would teach. */
  teachSubjects: SubjectKey[]
  nickname: string
}
