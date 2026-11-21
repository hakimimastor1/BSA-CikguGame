import type { Game, Trait, Txt } from '../types'
import { PERSONALITIES as PERSONALITIES_A, TRAIT_ORDER } from './story'
import { PERSONALITIES_B, TRAIT_ORDER_B } from './storyB'

export type PersonalityInfo = { name: string; tagline: Txt; description: Txt }

/** Every personality from both games, keyed by trait. */
export const PERSONALITY_INFO: Record<Trait, PersonalityInfo> = { ...PERSONALITIES_A, ...PERSONALITIES_B }

/** Tie-break order per game (the first listed wins a tie). */
export const TRAIT_ORDER_BY_GAME: Record<Game, Trait[]> = { cikgu: TRAIT_ORDER, pelajar: TRAIT_ORDER_B }

export const GAME_NAME: Record<Game, Txt> = {
  cikgu: { ms: 'Cikgu Sehari', en: 'Cikgu Sehari' },
  pelajar: { ms: 'Misi Pelajar Bijak', en: 'Smart Student Mission' },
}
