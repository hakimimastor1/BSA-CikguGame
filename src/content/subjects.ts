import type { Band, SubjectKey, Txt } from '../types'

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

/** Exact levels for the sign-up form. */
export const LEVELS_BY_BAND: Record<Band, Txt[]> = {
  std1_3: [1, 2, 3].map((n) => ({ ms: `Tahun ${n}`, en: `Standard ${n}` })),
  std4_6: [4, 5, 6].map((n) => ({ ms: `Tahun ${n}`, en: `Standard ${n}` })),
  f1_3: [1, 2, 3].map((n) => ({ ms: `Tingkatan ${n}`, en: `Form ${n}` })),
  f4_5: [4, 5].map((n) => ({ ms: `Tingkatan ${n}`, en: `Form ${n}` })),
}

/** All subjects BSA offers per band (from the website), for the trial picker. */
export const BSA_SUBJECTS: Record<Band, string[]> = {
  std1_3: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Pendidikan Islam', 'Bahasa Arab', 'ASK', 'Reka Bentuk Teknologi'],
  std4_6: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Pendidikan Islam', 'Bahasa Arab', 'ASK', 'Reka Bentuk Teknologi'],
  f1_3: ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah', 'Geografi', 'RBT', 'ASK'],
  f4_5: ['Bahasa Melayu', 'Bahasa Inggeris', 'Sejarah', 'Pendidikan Islam', 'Matematik', 'Sains', 'Fizik', 'Kimia', 'Biologi', 'Matematik Tambahan', 'Prinsip Perakaunan', 'RBT', 'PQS', 'PSI'],
}

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
