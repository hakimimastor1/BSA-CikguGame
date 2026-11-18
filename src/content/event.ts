import type { Txt } from '../types'

/**
 * The event this build runs for. In M2 this moves to the `events` table in Supabase,
 * chosen by the `?e=` parameter in the QR link.
 */
export const EVENT = {
  slug: 'peskon26',
  name: 'PESKON UPSI 2026',
  offerCode: 'PESKON UPSI 2026',
  offerValidUntil: { ms: '2 Disember 2026', en: '2 December 2026' } satisfies Txt,
  whatsapp: '601175234588',
  whatsappDisplay: '011-7523 4588',
  tutorRegisterUrl: 'https://brightscholaracademy.com.my/register',
  websiteUrl: 'https://brightscholaracademy.com.my/',
}

export const PRICES: Record<'primary' | 'lower' | 'upper', number> = {
  primary: 25,
  lower: 35,
  upper: 40,
}
