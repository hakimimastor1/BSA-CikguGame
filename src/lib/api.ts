import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Band, Game, Lang, Question, Role, SubjectKey, SubjectResult, Trait } from '../types'

// The project's API address and publishable key are public by design: visitors can only call the
// game functions, never read tables. Set VITE_SUPABASE_URL to an empty string for a local-only build.
const url = (import.meta.env.VITE_SUPABASE_URL ?? 'https://bfsjskgqlcafydejotsc.supabase.co') as string
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_akNWAL0QIIlHenb7qceVGQ_diX8E1od') as string

/** Null when the app is built without Supabase settings: the game then runs in local preview mode. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
export const online = supabase != null

/** Event from the QR link (?e=peskon26). */
export const eventSlug = (() => {
  try {
    const e = new URLSearchParams(window.location.search).get('e')
    if (e && /^[a-z0-9-]{2,40}$/.test(e)) return e
  } catch {
    /* ignore */
  }
  return 'peskon26'
})()

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message)
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Call a database function, retrying network failures (weak signal at the booth). */
async function rpc<T>(fn: string, args: Record<string, unknown>, tries = 3): Promise<T> {
  if (!supabase) throw new ApiError('offline', false)
  let last: ApiError = new ApiError('unknown', true)
  for (let i = 0; i < tries; i++) {
    try {
      const { data, error } = await supabase.rpc(fn, args)
      if (!error) return data as T
      // Errors raised by our functions (bad input, already finished…) won't change on retry.
      const retryable = !error.code || error.code === 'PGRST301' || /fetch|network|timeout/i.test(error.message)
      last = new ApiError(error.message, retryable)
      if (!retryable) throw last
    } catch (e) {
      if (e instanceof ApiError && !e.retryable) throw e
      last = e instanceof ApiError ? e : new ApiError(String(e), true)
    }
    if (i < tries - 1) await sleep(600 * (i + 1) * (i + 1))
  }
  throw last
}

export async function startPlay(args: {
  nickname: string
  role: Role
  game: Game
  band: Band
  lang: Lang
  teach: SubjectKey[]
}): Promise<{ playId: string; questions: Question[] }> {
  const r = await rpc<{ play_id: string; questions: Question[] }>('begin_play', {
    p_game: args.game,
    p_event: eventSlug,
    p_nickname: args.nickname,
    p_role: args.role,
    p_band: args.band,
    p_lang: args.lang,
    p_teach: args.teach,
  })
  return { playId: r.play_id, questions: r.questions }
}

export interface ServerResult {
  storyXp: number
  semakXp: number
  totalXp: number
  personality: Trait
  traitCounts: Record<Trait, number>
  subjects: SubjectResult[]
  rightMarks: number
  rank: number | null
  players: number
  boardMode?: 'manual' | 'daily'
}

export const finishPlay = (playId: string, choices: string[], marks: { id: string; verdict: boolean | null; ms: number; hint: boolean }[]) =>
  rpc<ServerResult>('finish_play', { p_play: playId, p_choices: choices, p_marks: marks })

export const submitSignup = (playId: string | null, data: Record<string, unknown>) =>
  rpc<{ ref: string; existing: boolean }>('submit_signup', { p_event: eventSlug, p_play: playId, p: data })

type BoardRow = { nickname: string; xp: number; personality: Trait }

export interface Board {
  event: { name: string; offerCode: string; offerValidUntil: string | null }
  day: string
  top: BoardRow[]
  /** Top 5 per game: cikgu = Cikgu Sehari, pelajar = Misi Pelajar Bijak. */
  boards?: Record<Game, BoardRow[]>
  /** Latest results; claimed = the player sent the sign-up form (trial claim or tutor application). */
  latest: (BoardRow & { game?: Game; role?: Role; claimed?: boolean })[]
  players: number
  playersByGame?: Record<Game, number>
  /** 'manual': boards run until an admin resets them; 'daily': they start fresh every midnight. */
  mode?: 'manual' | 'daily'
  /** Names per board on the projector (3, 5 or 10). */
  size?: number
  resetAt?: string | null
  mix: Partial<Record<Trait, number>>
}

export const leaderboard = (slug = eventSlug) => rpc<Board>('leaderboard', { p_event: slug, p_limit: 10 }, 1)
