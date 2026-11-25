const ADJECTIVES = ['Ceria', 'Bijak', 'Hebat', 'Gigih', 'Cekap', 'Bestari', 'Ligat', 'Tangkas', 'Rajin', 'Pintar', 'Mesra', 'Kental']

/** Cikgu Sehari players get a teacher name; Misi Pelajar Bijak players a student one. */
const STUDENT_WORDS = ['Juara', 'Bintang', 'Wira', 'Pelajar']
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

export function suggestNickname(game: 'cikgu' | 'pelajar' = 'cikgu'): string {
  const n = 10 + Math.floor(Math.random() * 90)
  return `${game === 'pelajar' ? pick(STUDENT_WORDS) : 'Cikgu'} ${pick(ADJECTIVES)} ${n}`
}

/**
 * Small BM/EN blocklist for names shown on the big screen. The server checks again (M2),
 * and staff can hide a name from the TV.
 */
const BLOCKED = [
  'babi', 'bodoh', 'sial', 'puki', 'pukimak', 'lancau', 'butoh', 'kote', 'pantat', 'jubur', 'haram jadah', 'bangsat', 'celaka', 'keparat', 'pelacur', 'sundal', 'bapuk', 'pondan', 'anjing', 'bengap', 'bahlul',
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'bastard', 'asshole', 'slut', 'whore', 'nigga', 'nigger', 'porn', 'sex',
]

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[^a-z ]/g, '')

export function isCleanNickname(name: string): boolean {
  const flat = normalise(name)
  const squashed = flat.replace(/\s+/g, '')
  return !BLOCKED.some((w) => flat.includes(w) || squashed.includes(w.replace(/\s+/g, '')))
}

export const NICK_MIN = 3
export const NICK_MAX = 20

export const cleanNicknameInput = (s: string) => s.replace(/\s+/g, ' ').slice(0, NICK_MAX)
