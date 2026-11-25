import type { Band, Stream, SubjectKey, Txt } from '../types'

export const SUBJECT_NAMES: Record<SubjectKey, Txt> = {
  bm: { ms: 'Bahasa Melayu', en: 'Bahasa Melayu' },
  bi: { ms: 'Bahasa Inggeris', en: 'English' },
  math: { ms: 'Matematik', en: 'Mathematics' },
  sci: { ms: 'Sains', en: 'Science' },
  phy: { ms: 'Fizik', en: 'Physics' },
  chem: { ms: 'Kimia', en: 'Chemistry' },
  bio: { ms: 'Biologi', en: 'Biology' },
}

/** Subjects that have Semak Kerja questions, per level band. */
export const BAND_SUBJECTS: Record<Band, SubjectKey[]> = {
  std1_3: ['bm', 'bi', 'math', 'sci'],
  std4_6: ['bm', 'bi', 'math', 'sci'],
  f1_3: ['bm', 'bi', 'math', 'sci'],
  f4_5: ['bm', 'bi', 'math', 'phy', 'chem', 'bio'],
}

export const BANDS: { id: Band; label: Txt; hint: Txt; price: number }[] = [
  { id: 'std1_3', label: { ms: 'Tahun 1–3', en: 'Standard 1–3' }, hint: { ms: 'Sekolah rendah', en: 'Primary school' }, price: 25 },
  { id: 'std4_6', label: { ms: 'Tahun 4–6', en: 'Standard 4–6' }, hint: { ms: 'Sekolah rendah', en: 'Primary school' }, price: 25 },
  { id: 'f1_3', label: { ms: 'Tingkatan 1–3', en: 'Form 1–3' }, hint: { ms: 'Menengah rendah', en: 'Lower secondary' }, price: 35 },
  { id: 'f4_5', label: { ms: 'Tingkatan 4–5', en: 'Form 4–5' }, hint: { ms: 'SPM', en: 'SPM' }, price: 40 },
]

export interface SchoolLevel {
  id: string
  label: Txt
  /** The band whose subjects and price apply; preschool and after-SPM borrow the nearest one. */
  band: Band
}

/** Every school level in order, so next year's class is simply the next entry. */
export const SCHOOL_LEVELS: SchoolLevel[] = [
  { id: 'pra', label: { ms: 'Prasekolah', en: 'Preschool' }, band: 'std1_3' },
  ...[1, 2, 3, 4, 5, 6].map((n): SchoolLevel => ({ id: `t${n}`, label: { ms: `Tahun ${n}`, en: `Standard ${n}` }, band: n <= 3 ? 'std1_3' : 'std4_6' })),
  ...[1, 2, 3, 4, 5].map((n): SchoolLevel => ({ id: `f${n}`, label: { ms: `Tingkatan ${n}`, en: `Form ${n}` }, band: n <= 3 ? 'f1_3' : 'f4_5' })),
  { id: 'spm', label: { ms: 'Lepasan SPM', en: 'After SPM' }, band: 'f4_5' },
]
export const levelById = (id: string) => SCHOOL_LEVELS.find((l) => l.id === id) ?? SCHOOL_LEVELS[1]
export const nextLevelId = (id: string) => SCHOOL_LEVELS[Math.min(SCHOOL_LEVELS.findIndex((l) => l.id === id) + 1, SCHOOL_LEVELS.length - 1)].id

/** This year's levels to pick from, for the band played (preschool for families with younger children). */
export const NOW_LEVELS_BY_BAND: Record<Band, string[]> = {
  std1_3: ['t1', 't2', 't3', 'pra'],
  std4_6: ['t4', 't5', 't6'],
  f1_3: ['f1', 'f2', 'f3'],
  f4_5: ['f4', 'f5'],
}
/** Next year's classes: Tahun 1 to after SPM. */
export const NEXT_LEVELS = SCHOOL_LEVELS.filter((l) => l.id !== 'pra').map((l) => l.id)

/** All subjects BSA offers per band (from the website), for the trial picker. */
export const BSA_SUBJECTS: Record<Band, string[]> = {
  std1_3: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Pendidikan Islam', 'Bahasa Arab', 'ASK', 'Reka Bentuk Teknologi'],
  std4_6: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Pendidikan Islam', 'Bahasa Arab', 'ASK', 'Reka Bentuk Teknologi'],
  f1_3: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Geografi', 'RBT', 'ASK'],
  f4_5: ['Bahasa Melayu', 'Bahasa Inggeris', 'Sejarah', 'Pendidikan Islam', 'Matematik', 'Sains', 'Fizik', 'Kimia', 'Biologi', 'Matematik Tambahan', 'Prinsip Perakaunan', 'RBT', 'PQS', 'PSI'],
}

/**
 * Form 4–5 streams. `quiz`: the question subjects for the stream (Sains Tulen: BI, Matematik and
 * 2 of the 3 sciences; every other stream: BM, BI, Matematik). `extras`: stream subjects BSA teaches,
 * suggested for the trial after the subjects the player found hard.
 */
export const STREAMS: { id: Stream; label: Txt; extras: string[] }[] = [
  { id: 'sains', label: { ms: 'Sains Tulen', en: 'Pure Science' }, extras: ['Matematik Tambahan', 'Fizik', 'Kimia', 'Biologi'] },
  { id: 'sastera', label: { ms: 'Sastera & Kemanusiaan', en: 'Arts & Humanities' }, extras: ['Sejarah', 'Prinsip Perakaunan'] },
  { id: 'agama', label: { ms: 'Agama', en: 'Religious Studies' }, extras: ['PSI', 'PQS', 'Sejarah'] },
  { id: 'teknik', label: { ms: 'Teknik & Vokasional', en: 'Technical & Vocational' }, extras: ['RBT'] },
  { id: 'belum', label: { ms: 'Belum pasti', en: 'Not sure yet' }, extras: [] },
]
export const streamById = (id?: string | null) => STREAMS.find((s) => s.id === id)
/** Tingkatan 4 and 5 have streams (not after SPM). */
export const levelHasStream = (levelId: string) => levelId === 'f4' || levelId === 'f5'

/** BSA's subject name (as on the website) for a question subject. */
export const SUBJECT_TO_BSA: Record<SubjectKey, string> = {
  bm: 'Bahasa Melayu',
  bi: 'Bahasa Inggeris',
  math: 'Matematik',
  sci: 'Sains',
  phy: 'Fizik',
  chem: 'Kimia',
  bio: 'Biologi',
}

/** One practical study tip per subject, shown for subjects with mistakes. */
export const STUDY_TIPS: Record<SubjectKey, Txt> = {
  bm: { ms: 'Baca satu petikan pendek setiap hari dan catat 3 perkataan baharu.', en: 'Read one short passage a day and note 3 new words.' },
  bi: { ms: 'Tonton video pendek dalam BI dengan sari kata, kemudian tulis 3 ayat.', en: 'Watch short English videos with subtitles, then write 3 sentences.' },
  math: { ms: 'Buat 5 soalan setiap hari dan semak langkah kerja, bukan jawapan sahaja.', en: 'Do 5 questions a day and check your working, not just the answer.' },
  sci: { ms: 'Lukis peta minda selepas setiap bab dan terangkan kepada orang lain.', en: 'Draw a mind map after each chapter and explain it to someone.' },
  phy: { ms: 'Fahami setiap formula bersama unitnya, kemudian cuba 3 soalan pengiraan.', en: 'Understand each formula with its units, then try 3 calculation questions.' },
  chem: { ms: 'Hafal 20 unsur pertama dalam Jadual Berkala dan banyakkan latihan menulis persamaan kimia.', en: 'Learn the first 20 elements and practise chemical equations.' },
  bio: { ms: 'Guna rajah berlabel dan kad imbas untuk menghafal istilah penting.', en: 'Use labelled diagrams and flashcards for key terms.' },
}

/** What the free 3-subject trial is worth at BSA's hourly price for the level (3 × 1 hour). */
export const trialValue = (band: Band) => (BANDS.find((b) => b.id === band)?.price ?? 0) * 3
