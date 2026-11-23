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
  /** Last day of the event and of the offer, in Malaysia time (YYYY-MM-DD). */
  endsOn: '2026-12-02',
  whatsapp: '601175234588',
  whatsappDisplay: '011-7523 4588',
  tutorRegisterUrl: 'https://brightscholaracademy.com.my/register',
  websiteUrl: 'https://brightscholaracademy.com.my/',
}

/** The trial and classes booked at the event are for next school year (2027 for PESKON UPSI 2026). */
export const NEXT_YEAR = Number(EVENT.endsOn.slice(0, 4)) + 1

export const PRICES: Record<'primary' | 'lower' | 'upper', number> = {
  primary: 25,
  lower: 35,
  upper: 40,
}

/** Today's date in Malaysia (YYYY-MM-DD). `?asOf=YYYY-MM-DD` in the URL overrides it for testing. */
export function todayMY(): string {
  try {
    const asOf = new URLSearchParams(window.location.search).get('asOf')
    if (asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf)) return asOf
  } catch {
    /* ignore */
  }
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
}

/** After the event: no booth, no gifts, and the event code no longer applies. */
export const eventOver = () => todayMY() > EVENT.endsOn
