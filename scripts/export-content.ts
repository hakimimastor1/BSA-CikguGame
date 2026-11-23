/**
 * Export every piece of game content to one JSON file for the content review page.
 *
 *   npx esbuild scripts/export-content.ts --bundle --platform=node --outfile=/tmp/export.cjs
 *   node /tmp/export.cjs out/content.json
 *
 * Each item has a stable id (the same id the code uses where there is one), so review notes
 * can be matched back to the source file.
 */
import { writeFileSync } from 'node:fs'
import type { StoryScene, Txt } from '../src/types'
import { STORY, STORY_INTRO, PERSONALITIES, GOOD_XP } from '../src/content/story'
import { STORY_B, INTRO_B, PERSONALITIES_B, STYLE_TIPS } from '../src/content/storyB'
import { BANDS, SUBJECT_NAMES, STUDY_TIPS } from '../src/content/subjects'
import { S } from '../src/content/strings'
import { EVENT } from '../src/content/event'
import questions from '../src/content/questions.json'

type Row = { k: string; ms: string; en?: string; note?: string }
type Item = { id: string; sec: string; group?: string; title: string; src: string; meta?: string[]; rows: Row[] }

const items: Item[] = []
const txt = (k: string, v: Txt, note?: string): Row => ({ k, ms: v.ms, en: v.en, note })
const traitName = (trait: string | null) =>
  trait == null ? 'Pilihan biasa' : ((PERSONALITIES as Record<string, { name: string }>)[trait] ?? (PERSONALITIES_B as Record<string, { name: string }>)[trait]).name

function scenes(sec: string, src: string, list: StoryScene[]) {
  list.forEach((sc, i) => {
    const rows: Row[] = [txt('Tajuk', sc.title), txt('Situasi', sc.situation)]
    sc.choices.forEach((c, j) => {
      const letter = String.fromCharCode(65 + j)
      rows.push(txt(`Pilihan ${letter}`, c.text, `${traitName(c.trait)} · +${c.xp} XP`))
      rows.push(txt(`Tip selepas ${letter}`, c.reaction))
    })
    items.push({ id: sc.id, sec, title: `Situasi ${i + 1}: ${sc.title.ms}`, src, meta: [`${sc.choices.length} pilihan`], rows })
  })
}

// Game A
items.push({
  id: 'A-intro-tutor', sec: 'game-a', title: 'Pengenalan (pelajar/graduan UPSI)', src: 'src/content/story.ts',
  rows: [txt('Tajuk', STORY_INTRO.tutor.title), txt('Teks', STORY_INTRO.tutor.body)],
})
items.push({
  id: 'A-intro-family', sec: 'game-a', title: 'Pengenalan (ibu bapa yang pilih Cikgu)', src: 'src/content/story.ts',
  rows: [txt('Tajuk', STORY_INTRO.learner.title), txt('Teks', STORY_INTRO.learner.body)],
})
scenes('game-a', 'src/content/story.ts', STORY)

// Game B
items.push({
  id: 'B-intro', sec: 'game-b', title: 'Pengenalan', src: 'src/content/storyB.ts',
  rows: [txt('Tajuk', INTRO_B.title), txt('Teks', INTRO_B.body)],
})
scenes('game-b', 'src/content/storyB.ts', STORY_B)

// Personality types
for (const [k, p] of Object.entries(PERSONALITIES)) {
  items.push({
    id: `P-${k}`, sec: 'jenis', group: 'Jenis cikgu (Game A)', title: p.name, src: 'src/content/story.ts',
    rows: [{ k: 'Nama', ms: p.name }, txt('Slogan', p.tagline), txt('Penerangan', p.description)],
  })
}
for (const [k, p] of Object.entries(PERSONALITIES_B)) {
  const tips = STYLE_TIPS[k as keyof typeof STYLE_TIPS]
  items.push({
    id: `P-${k}`, sec: 'jenis', group: 'Jenis pelajar (Game B)', title: p.name, src: 'src/content/storyB.ts',
    rows: [
      { k: 'Nama', ms: p.name }, txt('Slogan', p.tagline), txt('Penerangan', p.description),
      ...tips.map((tip, i) => txt(`Cara belajar ${i + 1}`, tip)),
    ],
  })
}

// Question bank
const bandLabel = Object.fromEntries(BANDS.map((b) => [b.id, b.label.ms]))
for (const q of questions as { id: string; band: string; subject: string; q: Txt; a: Txt; correct: boolean; fix: Txt }[]) {
  items.push({
    id: q.id, sec: 'soalan', group: `${bandLabel[q.band]} · ${SUBJECT_NAMES[q.subject as keyof typeof SUBJECT_NAMES].ms}`,
    title: q.q.ms, src: 'src/content/questions.json',
    meta: [bandLabel[q.band], SUBJECT_NAMES[q.subject as keyof typeof SUBJECT_NAMES].ms, q.correct ? 'Jawapan ditunjuk: BETUL' : 'Jawapan ditunjuk: SALAH'],
    rows: [
      txt('Soalan', q.q),
      txt('Jawapan ditunjuk', q.a, 'Game A: jawapan murid · Game B: jawapan untuk dinilai'),
      { k: 'Jawapan itu betul?', ms: q.correct ? 'Ya, betul' : 'Tidak, salah', en: q.correct ? 'Yes' : 'No' },
      txt('Jawapan sebenar', q.fix, 'Ditunjuk bila pemain silap, dan dalam bantuan Tanya Cikgu BSA'),
    ],
  })
}

// Subject tips
for (const [k, tip] of Object.entries(STUDY_TIPS)) {
  items.push({
    id: `tip-${k}`, sec: 'tip', title: SUBJECT_NAMES[k as keyof typeof SUBJECT_NAMES].ms, src: 'src/content/subjects.ts',
    rows: [txt('Tip naik level', tip, 'Laporan mini, untuk subjek yang paling lemah')],
  })
}

// Messages the system writes for people (WhatsApp, admin follow-up, share card)
const s = S as unknown as Record<string, Txt>
items.push({
  id: 'msg-claim', sec: 'mesej', title: 'WhatsApp: tuntut trial (pelajar / ibu bapa)', src: 'src/content/strings.ts · waLearner',
  meta: [`Dihantar ke ${EVENT.whatsappDisplay}`],
  rows: [
    txt('Mesej', s.waLearner, 'Baris {details}: Nama, Nama anak (ibu bapa), Ibu bapa / penjaga (pelajar bawah 18), Tahap, Sekolah, Subjek'),
    txt('Selepas 2 Dis', s.waLearnerAfter),
  ],
})
items.push({
  id: 'msg-tutor', sec: 'mesej', title: 'WhatsApp: bakal tutor', src: 'src/content/strings.ts · waTutor',
  meta: [`Dihantar ke ${EVENT.whatsappDisplay}`], rows: [txt('Mesej', s.waTutor)],
})
items.push({
  id: 'msg-followup-learner', sec: 'mesej', title: 'Admin: mesej susulan kepada ibu bapa / pelajar', src: 'src/pages/Admin.tsx · followUpMessage',
  meta: ['Butang WhatsApp di Admin → Pendaftaran'],
  rows: [{
    k: 'Mesej',
    ms: `Hai {ibu bapa atau nama}! Ini Bright Scholar Academy. Terima kasih kerana bermain {Cikgu Sehari / Misi Pelajar Bijak} di booth kami di ${EVENT.name}. Keputusan {Semak Kerja / Kuiz Kilat} {anak}: {subjek betul/jumlah}. Jom tetapkan masa untuk trial percuma 3 subjek ({subjek}) untuk {anak}. Bila masa yang sesuai? Rujukan: {rujukan}`,
  }],
})
items.push({
  id: 'msg-followup-tutor', sec: 'mesej', title: 'Admin: mesej susulan kepada bakal tutor', src: 'src/pages/Admin.tsx · followUpMessage',
  meta: ['Butang WhatsApp di Admin → Pendaftaran'],
  rows: [{
    k: 'Mesej',
    ms: `Hai {nama}! Ini Bright Scholar Academy. Terima kasih kerana berminat menjadi tutor BSA di ${EVENT.name}. Boleh kami tetapkan sesi temu duga ringkas dan demo mengajar? Bila anda free? Rujukan: {rujukan}`,
  }],
})
items.push({
  id: 'msg-share', sec: 'mesej', title: 'Teks kongsi kad keputusan', src: 'src/content/strings.ts · shareText',
  rows: [txt('Game A', s.shareText), txt('Game B', s.shareTextB)],
})
items.push({
  id: 'msg-screens', sec: 'mesej', title: 'Projektor dan poster', src: 'src/pages/Tv.tsx, src/pages/Poster.tsx',
  rows: [
    { k: 'Tajuk', ms: 'Jom Main!', en: '2 permainan · 1 QR · Let\'s play!' },
    { k: 'Papan', ms: 'Top Cikgu Sehari · Bakal cikgu', en: 'Top Pelajar Bijak · Pelajar sekolah' },
    { k: 'Kotak UPSI', ms: 'Pelajar UPSI · Cikgu Sehari · Jadi tutor BSA · RM25–40/jam' },
    { k: 'Kotak sekolah', ms: `Adik-adik sekolah · Misi Pelajar Bijak · Trial percuma + beg · Kod ${EVENT.offerCode}` },
    { k: 'Poster, langkah', ms: 'Imbas kod QR · Pilih permainan · Masuk papan skor!' },
    { k: 'Hadiah', ms: 'Semua pemain dapat sticker!' },
  ],
})

// Every on-screen string, grouped by screen
const GROUPS: [string, RegExp][] = [
  ['Skrin pertama', /^welcome/],
  ['Pilih peranan & permainan', /^(role|game)/],
  ['Tahap & nama gelaran', /^(level|teach|nick)/],
  ['Situasi', /^(scene|tip|xp|continue|next|back)/],
  ['Semak Kerja (Game A)', /^semak/],
  ['Kuiz Kilat & bantuan (Game B)', /^(quiz|hint)/],
  ['Skrin keputusan', /^(result|report|review|style|trial|share)/],
  ['Borang daftar', /^(signup|f[A-Z]|submit|av)/],
  ['Skrin tawaran', /^offer/],
  ['Mesej WhatsApp (label)', /^wa/],
]
const buckets = new Map<string, Row[]>()
for (const [key, v] of Object.entries(s)) {
  if (!v || typeof v !== 'object' || !('ms' in v)) continue
  const g = GROUPS.find(([, re]) => re.test(key))?.[0] ?? 'Lain-lain'
  if (!buckets.has(g)) buckets.set(g, [])
  buckets.get(g)!.push({ k: key, ms: v.ms, en: v.en })
}
for (const [g, rows] of [...GROUPS.map(([g]) => g), 'Lain-lain'].filter((g) => buckets.has(g)).map((g) => [g, buckets.get(g)!] as const)) {
  items.push({ id: `ui-${g.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`, sec: 'skrin', title: g, src: 'src/content/strings.ts', meta: [`${rows.length} teks`], rows })
}

const SECTIONS = [
  { id: 'game-a', name: 'Game A · Cikgu Sehari', blurb: 'Cerita untuk bakal cikgu: 5 situasi. Pilihan biasa dapat 10 XP, pilihan yang menunjukkan satu jenis cikgu dapat ' + GOOD_XP + ' XP.' },
  { id: 'game-b', name: 'Game B · Misi Pelajar Bijak', blurb: 'Cerita untuk pelajar sekolah: 5 situasi harian. Setiap pilihan baik menunjukkan satu jenis pelajar.' },
  { id: 'jenis', name: 'Jenis cikgu & pelajar', blurb: 'Keputusan di hujung cerita: 5 jenis cikgu dan 5 jenis pelajar, dengan cara belajar untuk Game B.' },
  { id: 'soalan', name: 'Bank soalan', blurb: 'Soalan Semak Kerja (Game A) dan Kuiz Kilat (Game B). Setiap permainan pilih 8 soalan ikut tahap. Semak soalan, jawapan yang ditunjuk, sama ada jawapan itu betul, dan jawapan sebenar.' },
  { id: 'tip', name: 'Tip subjek', blurb: 'Tip naik level dalam laporan mini, untuk subjek yang paling lemah.' },
  { id: 'mesej', name: 'Mesej & poster', blurb: 'Mesej WhatsApp yang ditulis oleh sistem, teks kongsi dan teks projektor/poster.' },
  { id: 'skrin', name: 'Teks skrin', blurb: 'Semua teks butang dan skrin, ikut skrin. {nama} dalam kurungan kerinting diganti dengan maklumat sebenar.' },
]

const out = process.argv[2] ?? 'content.json'
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), sections: SECTIONS, items }))
console.log(`wrote ${out}: ${items.length} items`, Object.fromEntries(SECTIONS.map((x) => [x.id, items.filter((i) => i.sec === x.id).length])))
