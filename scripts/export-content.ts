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
import { BANDS, STREAMS, SUBJECT_NAMES, STUDY_TIPS } from '../src/content/subjects'
import { S } from '../src/content/strings'
import { EVENT } from '../src/content/event'
import questions from '../src/content/questions.json'

type Row = { k: string; ms: string; en?: string; note?: string }
type Item = { id: string; sec: string; group?: string; title: string; titleMs?: string; src: string; meta?: string[]; rows: Row[] }

const items: Item[] = []
const txt = (k: string, v: Txt, note?: string): Row => ({ k, ms: v.ms, en: v.en, note })
const traitName = (trait: string | null) =>
  trait == null ? 'Ordinary choice' : ((PERSONALITIES as Record<string, { name: string }>)[trait] ?? (PERSONALITIES_B as Record<string, { name: string }>)[trait]).name

function scenes(sec: string, src: string, list: StoryScene[]) {
  list.forEach((sc, i) => {
    const rows: Row[] = [txt('Title', sc.title), txt('Situation', sc.situation)]
    sc.choices.forEach((c, j) => {
      const letter = String.fromCharCode(65 + j)
      rows.push(txt(`Choice ${letter}`, c.text, `${traitName(c.trait)} · +${c.xp} XP`))
      rows.push(txt(`Tip after ${letter}`, c.reaction))
    })
    items.push({ id: sc.id, sec, title: `Situation ${i + 1}: ${sc.title.en}`, titleMs: sc.title.ms, src, meta: [`${sc.choices.length} choices`], rows })
  })
}

// Game A
items.push({
  id: 'A-intro-tutor', sec: 'game-a', title: 'Intro (UPSI students and graduates)', src: 'src/content/story.ts',
  rows: [txt('Title', STORY_INTRO.tutor.title), txt('Text', STORY_INTRO.tutor.body)],
})
items.push({
  id: 'A-intro-family', sec: 'game-a', title: 'Intro (parents who pick Cikgu)', src: 'src/content/story.ts',
  rows: [txt('Title', STORY_INTRO.learner.title), txt('Text', STORY_INTRO.learner.body)],
})
scenes('game-a', 'src/content/story.ts', STORY)

// Game B
items.push({
  id: 'B-intro', sec: 'game-b', title: 'Intro', src: 'src/content/storyB.ts',
  rows: [txt('Title', INTRO_B.title), txt('Text', INTRO_B.body)],
})
scenes('game-b', 'src/content/storyB.ts', STORY_B)

// Personality types
for (const [k, p] of Object.entries(PERSONALITIES)) {
  items.push({
    id: `P-${k}`, sec: 'jenis', group: 'Teacher types (Game A)', title: p.name, src: 'src/content/story.ts',
    rows: [{ k: 'Name', ms: p.name }, txt('Tagline', p.tagline), txt('Description', p.description)],
  })
}
for (const [k, p] of Object.entries(PERSONALITIES_B)) {
  const tips = STYLE_TIPS[k as keyof typeof STYLE_TIPS]
  items.push({
    id: `P-${k}`, sec: 'jenis', group: 'Learner types (Game B)', title: p.name, src: 'src/content/storyB.ts',
    rows: [
      { k: 'Name', ms: p.name }, txt('Tagline', p.tagline), txt('Description', p.description),
      ...tips.map((tip, i) => txt(`Study tip ${i + 1}`, tip)),
    ],
  })
}

// Question bank
const bandLabel = Object.fromEntries(BANDS.map((b) => [b.id, b.label.en]))
for (const q of questions as { id: string; band: string; subject: string; q: Txt; a: Txt; correct: boolean; fix: Txt }[]) {
  items.push({
    id: q.id, sec: 'soalan', group: `${bandLabel[q.band]} · ${SUBJECT_NAMES[q.subject as keyof typeof SUBJECT_NAMES].en}`,
    title: q.q.en, titleMs: q.q.ms, src: 'src/content/questions.json',
    meta: [bandLabel[q.band], SUBJECT_NAMES[q.subject as keyof typeof SUBJECT_NAMES].en, q.correct ? 'Answer shown: RIGHT' : 'Answer shown: WRONG'],
    rows: [
      txt('Question', q.q),
      txt('Answer shown', q.a, "Game A: the pupil's answer · Game B: the answer to judge"),
      { k: 'Is that answer right?', ms: q.correct ? 'Ya, betul' : 'Tidak, salah', en: q.correct ? 'Yes, right' : 'No, wrong' },
      txt('Correct answer', q.fix, 'Shown when the player gets it wrong, and by the Tanya Cikgu BSA hint'),
    ],
  })
}

// Subject tips
for (const [k, tip] of Object.entries(STUDY_TIPS)) {
  items.push({
    id: `tip-${k}`, sec: 'tip', title: SUBJECT_NAMES[k as keyof typeof SUBJECT_NAMES].en, src: 'src/content/subjects.ts',
    rows: [txt('Level-up tip', tip, 'Mini report, for every subject with a mistake')],
  })
}

// Form 4–5 streams
items.push({
  id: 'streams', sec: 'tip', title: 'Form 4–5 streams', titleMs: 'Aliran Tingkatan 4–5', src: 'src/content/subjects.ts · STREAMS',
  meta: ['Asked after Tingkatan 4–5 (students and parents) and in the sign-up form'],
  rows: STREAMS.map((x) => txt(x.label.en, x.label, x.id === 'sains'
    ? 'Quiz: BI, Mathematics + 2 of Physics, Chemistry, Biology · Trial suggests: ' + x.extras.join(', ')
    : 'Quiz: BM, BI, Mathematics' + (x.extras.length ? ' · Trial suggests: ' + x.extras.join(', ') : ''))),
})

// Messages the system writes for people (WhatsApp, admin follow-up, share card)
const s = S as unknown as Record<string, Txt>
items.push({
  id: 'msg-claim', sec: 'mesej', title: 'WhatsApp: claim the trial (students / parents)', src: 'src/content/strings.ts · waLearner',
  meta: [`Sent to ${EVENT.whatsappDisplay}`],
  rows: [
    txt('Message', s.waLearner, '{details} lines: Name, Child\'s name (parents), Parent / guardian (students under 18), Level now, Class next year, Stream (Form 4–5), School, Area, Subjects'),
    txt('After 2 Dec', s.waLearnerAfter),
  ],
})
items.push({
  id: 'msg-followup-learner', sec: 'mesej', title: 'Admin: follow-up message to parents / students', src: 'src/pages/Admin.tsx · followUpMessage',
  meta: ['WhatsApp button in Admin → Pendaftaran', 'BM only'],
  rows: [{
    k: 'Message',
    ms: `Hai {ibu bapa atau nama}! Ini Bright Scholar Academy. Terima kasih kerana bermain {Cikgu Sehari / Misi Pelajar Bijak} di booth kami di ${EVENT.name}. Keputusan {Semak Kerja / Kuiz Kilat} {anak}: {subjek betul/jumlah}. Jom tetapkan masa untuk trial percuma 3 subjek ({subjek}) untuk {anak}. Bila masa yang sesuai? Rujukan: {rujukan}`,
  }],
})
items.push({
  id: 'msg-followup-tutor', sec: 'mesej', title: 'Admin: follow-up message to future tutors', src: 'src/pages/Admin.tsx · followUpMessage',
  meta: ['WhatsApp button in Admin → Pendaftaran', 'BM only'],
  rows: [{
    k: 'Message',
    ms: `Hai {nama}! Ini Bright Scholar Academy. Terima kasih kerana berminat menjadi tutor BSA di ${EVENT.name}. Boleh kami tetapkan sesi temu duga ringkas dan demo mengajar? Bila anda free? Rujukan: {rujukan}`,
  }],
})
items.push({
  id: 'msg-share', sec: 'mesej', title: 'Result card share text', src: 'src/content/strings.ts · shareText',
  rows: [txt('Game A', s.shareText), txt('Game B', s.shareTextB)],
})
items.push({
  id: 'msg-screens', sec: 'mesej', title: 'Projector and poster', src: 'src/pages/Tv.tsx, src/pages/Poster.tsx',
  rows: [
    { k: 'Headline', ms: 'Jom Main! · 2 permainan · 1 QR', en: "Let's play! · 2 games · 1 QR" },
    { k: 'Boards', ms: 'Top Cikgu Sehari · Bakal cikgu | Top Pelajar Bijak · Pelajar sekolah', en: 'Top Cikgu Sehari · Future teachers | Top Pelajar Bijak · School students' },
    { k: 'UPSI box', ms: 'Pelajar UPSI · Cikgu Sehari · Jadi tutor BSA · RM25–40/jam' },
    { k: 'School box', ms: `Adik-adik sekolah · Misi Pelajar Bijak · Trial percuma + beg · Kod ${EVENT.offerCode}` },
    { k: 'Poster steps', ms: 'Imbas kod QR · Pilih permainan · Masuk papan skor!', en: 'Scan the QR code · Pick your game · Get on the leaderboard!' },
    { k: 'Gift', ms: 'Semua pemain dapat sticker!', en: 'Every player gets a sticker!' },
  ],
})

// Every on-screen string, grouped by screen
const GROUPS: [string, RegExp][] = [
  ['Welcome screen', /^welcome/],
  ['Role and game pick', /^(role|game)/],
  ['Level and nickname', /^(level|stream|teach|nick)/],
  ['Situations', /^(scene|tip|xp|continue|next|back)/],
  ['Semak Kerja (Game A)', /^semak/],
  ['Kuiz Kilat and hint (Game B)', /^(quiz|hint)/],
  ['Result screen', /^(result|report|review|style|trial|share)/],
  ['Sign-up form', /^(signup|f[A-Z]|submit|av)/],
  ['Offer screen', /^offer/],
  ['WhatsApp message labels', /^wa/],
]
const buckets = new Map<string, Row[]>()
for (const [key, v] of Object.entries(s)) {
  if (!v || typeof v !== 'object' || !('ms' in v)) continue
  const g = GROUPS.find(([, re]) => re.test(key))?.[0] ?? 'Other'
  if (!buckets.has(g)) buckets.set(g, [])
  buckets.get(g)!.push({ k: key, ms: v.ms, en: v.en })
}
for (const [g, rows] of [...GROUPS.map(([g]) => g), 'Other'].filter((g) => buckets.has(g)).map((g) => [g, buckets.get(g)!] as const)) {
  items.push({ id: `ui-${g.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`, sec: 'skrin', title: g, src: 'src/content/strings.ts', meta: [`${rows.length} texts`], rows })
}

const SECTIONS = [
  { id: 'game-a', name: 'Game A · Cikgu Sehari', blurb: 'The story for future teachers: 5 situations. An ordinary choice earns 10 XP; a choice that shows a teacher type earns ' + GOOD_XP + ' XP.' },
  { id: 'game-b', name: 'Game B · Misi Pelajar Bijak', blurb: 'The story for school students: 5 everyday situations. Each good choice shows a learner type.' },
  { id: 'jenis', name: 'Teacher and learner types', blurb: 'The result at the end of each story: 5 teacher types and 5 learner types, with study tips for Game B.' },
  { id: 'soalan', name: 'Question bank', blurb: 'Questions for Semak Kerja (Game A) and Kuiz Kilat (Game B). Each play picks 8 questions for the chosen level. Check the question, the answer shown, whether that answer is right, and the correct answer.' },
  { id: 'tip', name: 'Subject tips and streams', blurb: 'Level-up tips in the mini report (for every subject with a mistake; full-mark subjects get praise instead), and the Form 4–5 streams.' },
  { id: 'mesej', name: 'Messages and poster', blurb: 'WhatsApp messages the system writes, the share text, and projector and poster text.' },
  { id: 'skrin', name: 'Screen text', blurb: 'Every button and screen text, by screen. Words in {curly brackets} are replaced with real details.' },
]

const out = process.argv[2] ?? 'content.json'
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), sections: SECTIONS, items }))
console.log(`wrote ${out}: ${items.length} items`, Object.fromEntries(SECTIONS.map((x) => [x.id, items.filter((i) => i.sec === x.id).length])))
