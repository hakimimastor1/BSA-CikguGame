import type { Band, Game, Mark, PlayResult, Question, StoryChoice, SubjectKey, SubjectResult, Trait } from '../types'
import { BAND_SUBJECTS } from '../content/subjects'
import { TRAIT_ORDER_BY_GAME } from '../content/personalities'
import type { ServerResult } from '../lib/api'

export const SEMAK_ITEMS = 8
export const SEMAK_SECONDS = 45
export const MARK_XP = 20
export const SPEED_XP_MAX = 5
export const STREAK_XP = 5
/** Taps faster than this can't have been read, so they score nothing (the server does the same). */
export const MIN_MARK_MS = 250

const shuffle = <T,>(arr: T[], rand = Math.random): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Which 4 subjects a round uses. */
export function roundSubjects(band: Band, teachSubjects: SubjectKey[] = []): SubjectKey[] {
  const available = BAND_SUBJECTS[band]
  const picked = teachSubjects.filter((s) => available.includes(s))
  if (band === 'f4_5' && picked.length === 0) {
    // SPM: BI and Matematik, plus 2 of the three sciences.
    return ['bi', 'math', ...shuffle(['phy', 'chem', 'bio'] as SubjectKey[]).slice(0, 2)]
  }
  const rest = shuffle(available.filter((s) => !picked.includes(s)))
  return [...picked, ...rest].slice(0, 4)
}

/**
 * 8 items: 2 from each of 4 subjects, with roughly half the pupil answers wrong.
 * In M2 the server picks these and keeps `correct` hidden until the play is submitted.
 */
export function pickQuestions(bank: Question[], band: Band, teachSubjects: SubjectKey[] = []): Question[] {
  const subjects = roundSubjects(band, teachSubjects)
  const chosen: Question[] = []
  for (const s of subjects) {
    const pool = bank.filter((q) => q.band === band && q.subject === s)
    const right = shuffle(pool.filter((q) => q.correct))
    const wrong = shuffle(pool.filter((q) => !q.correct))
    // One right and one wrong per subject when possible, so the round isn't guessable.
    const pair = [right[0], wrong[0]].filter(Boolean) as Question[]
    const extra = shuffle(pool.filter((q) => !pair.includes(q)))
    chosen.push(...[...pair, ...extra].slice(0, 2))
  }
  return shuffle(chosen).slice(0, SEMAK_ITEMS)
}

/** XP for one mark, given the streak of right marks before it. */
export const HINT_XP = 10

export function markXp(right: boolean, ms: number, streakBefore: number, hint = false): number {
  if (!right || ms < MIN_MARK_MS) return 0
  if (hint) return HINT_XP
  const speed = Math.max(0, Math.round(SPEED_XP_MAX * (1 - ms / 5000)))
  const streak = streakBefore >= 2 ? STREAK_XP : 0
  return MARK_XP + speed + streak
}

export function scorePlay(
  storyPicks: StoryChoice[],
  questions: Question[],
  marks: Mark[],
  game: Game = 'cikgu',
): PlayResult {
  const order = TRAIT_ORDER_BY_GAME[game]
  const traitCounts = Object.fromEntries([...TRAIT_ORDER_BY_GAME.cikgu, ...TRAIT_ORDER_BY_GAME.pelajar].map((t) => [t, 0])) as Record<Trait, number>
  let storyXp = 0
  for (const c of storyPicks) {
    storyXp += c.xp
    if (c.trait) traitCounts[c.trait] += 1
  }
  const personality = order.reduce((best, tr) => (traitCounts[tr] > traitCounts[best] ? tr : best), order[0])

  let semakXp = 0
  let streak = 0
  let rightMarks = 0
  const bySubject = new Map<SubjectKey, SubjectResult>()
  for (const q of questions) {
    const entry = bySubject.get(q.subject) ?? { subject: q.subject, right: 0, total: 0 }
    entry.total += 1
    const m = marks.find((x) => x.questionId === q.id)
    const right = m != null && m.verdict === q.correct && m.ms >= MIN_MARK_MS
    if (right) {
      semakXp += markXp(true, m!.ms, streak, m!.hint)
      streak += 1
      rightMarks += 1
      entry.right += 1
    } else {
      streak = 0
    }
    bySubject.set(q.subject, entry)
  }
  const subjects = [...bySubject.values()]
  const { strongest, levelUp } = subjectSummary(subjects)

  return {
    storyXp,
    semakXp,
    totalXp: storyXp + semakXp,
    personality,
    traitCounts,
    subjects,
    strongest,
    levelUp,
    rightMarks,
  }
}

export function subjectSummary(subjects: SubjectResult[]): { strongest: SubjectKey | null; levelUp: SubjectKey[] } {
  const ranked = [...subjects].sort((a, b) => b.right / b.total - a.right / a.total)
  const strongest = ranked.length && ranked[0].right > 0 ? ranked[0].subject : null
  const levelUp = subjects
    .filter((s) => s.right < s.total)
    .sort((a, b) => a.right / a.total - b.right / b.total)
    .map((s) => s.subject)
  return { strongest, levelUp }
}

/** The server's scoring is the one that counts; keep the subject order the phone showed. */
export function fromServer(r: ServerResult, local: PlayResult): PlayResult {
  const order = local.subjects.map((s) => s.subject)
  const subjects = [...r.subjects].sort((a, b) => order.indexOf(a.subject) - order.indexOf(b.subject))
  return {
    storyXp: r.storyXp,
    semakXp: r.semakXp,
    totalXp: r.totalXp,
    personality: r.personality,
    traitCounts: r.traitCounts,
    subjects,
    ...subjectSummary(subjects),
    rightMarks: r.rightMarks,
    rank: r.rank,
    players: r.players,
  }
}
