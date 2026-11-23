import type { StoryScene, Trait, Txt } from '../types'
import { GOOD_XP, OKAY_XP } from './story'

/** Game B, "Misi Pelajar Bijak": the player is the student. Choices reveal how they learn best. */
export const INTRO_B: { title: Txt; body: Txt } = {
  title: { ms: 'Misi Pelajar Bijak!', en: 'Smart Student Mission!' },
  body: {
    ms: '5 situasi harian pelajar + Kuiz Kilat. Kenali jenis pelajar anda dan cara belajar yang paling sesuai!',
    en: '5 everyday student situations + a Quick Quiz. Discover your learner type and how you learn best!',
  },
}

export const STORY_B: StoryScene[] = [
  {
    id: 'p1',
    title: { ms: 'Esok ada ujian!', en: 'Test tomorrow!' },
    situation: {
      ms: 'Malam ini anda perlu ulang kaji Sains untuk ujian esok. Apa yang anda buat?',
      en: "Tonight you need to revise Science for tomorrow's test. What do you do?",
    },
    choices: [
      {
        id: 'p1a',
        trait: 'visual',
        xp: GOOD_XP,
        text: { ms: 'Lukis peta minda berwarna untuk setiap bab', en: 'Draw a colourful mind map for each chapter' },
        reaction: { ms: 'Peta minda membantu otak ingat gambaran keseluruhan!', en: 'Mind maps help your brain remember the big picture!' },
      },
      {
        id: 'p1b',
        trait: 'pendengar',
        xp: GOOD_XP,
        text: { ms: 'Baca nota kuat-kuat dan rakam suara sendiri', en: 'Read your notes aloud and record yourself' },
        reaction: { ms: 'Dengar suara sendiri buat fakta lebih mudah diingat!', en: 'Hearing your own voice makes facts stick!' },
      },
      {
        id: 'p1d',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Main game dulu, ulang kaji pukul 11 malam', en: 'Play games first, revise at 11pm' },
        reaction: { ms: 'Hmm, otak dah penat lewat malam. Ulang kaji awal dan tidur secukupnya!', en: 'Hmm, a tired brain at night learns less. Study early and sleep well!' },
      },
      {
        id: 'p1c',
        trait: 'sosial',
        xp: GOOD_XP,
        text: { ms: 'Video call dengan kawan dan saling menguji', en: 'Video call a friend and quiz each other' },
        reaction: {
          ms: 'Belajar berdua lebih seronok, dan anda tahu bahagian mana yang belum faham.',
          en: "Studying together is more fun, and you find out what you haven't understood.",
        },
      },
    ],
  },
  {
    id: 'p2',
    title: { ms: 'Kerja rumah susah', en: 'Tough homework' },
    situation: {
      ms: 'Ada satu soalan Matematik yang anda langsung tak faham. Apa yang anda buat?',
      en: "There's one Maths question you just don't get. What do you do?",
    },
    choices: [
      {
        id: 'p2a',
        trait: 'aktif',
        xp: GOOD_XP,
        text: { ms: 'Guna benda di sekeliling (gula-gula, pembaris) untuk faham', en: 'Use objects (sweets, a ruler) to work it out' },
        reaction: { ms: 'Bila tangan bergerak, otak pun cepat faham!', en: 'When your hands get busy, your brain catches on!' },
      },
      {
        id: 'p2d',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Tiru jawapan kawan esok pagi', en: "Copy a friend's answer tomorrow morning" },
        reaction: { ms: 'Siap, tapi tak faham. Nanti susah masa ujian. Lebih baik tanya!', en: "Done, but not understood. It'll hurt in the test. Better to ask!" },
      },
      {
        id: 'p2b',
        trait: 'pemikir',
        xp: GOOD_XP,
        text: { ms: 'Baca semula contoh dalam buku, langkah demi langkah', en: 'Reread the textbook example step by step' },
        reaction: { ms: 'Teliti setiap langkah, nanti anda jumpa caranya sendiri!', en: 'Check each step and you find the way yourself!' },
      },
      {
        id: 'p2c',
        trait: 'sosial',
        xp: GOOD_XP,
        text: { ms: 'Tanya kakak, abang atau cikgu', en: 'Ask your sibling or a teacher' },
        reaction: { ms: 'Bertanya itu tanda bijak, bukan tanda lemah!', en: "Asking is smart, not weak!" },
      },
    ],
  },
  {
    id: 'p3',
    title: { ms: 'Telefon asyik berbunyi', en: 'Phone keeps buzzing' },
    situation: {
      ms: 'Anda sedang belajar, tapi telefon asyik berbunyi sebab mesej masuk. Apa yang anda buat?',
      en: 'You are studying, but your phone keeps buzzing with messages. What do you do?',
    },
    choices: [
      {
        id: 'p3c',
        trait: 'visual',
        xp: GOOD_XP,
        text: { ms: 'Tampal jadual belajar berwarna di dinding', en: 'Stick a colourful study timetable on the wall' },
        reaction: { ms: 'Nampak jadual, rasa lebih komited. Bagus!', en: 'Seeing the plan keeps you on track. Nice!' },
      },
      {
        id: 'p3a',
        trait: 'aktif',
        xp: GOOD_XP,
        text: { ms: 'Simpan telefon di bilik lain: belajar 25 minit, rehat 5 minit', en: 'Put the phone in another room: 25 min study, 5 min break' },
        reaction: { ms: 'Teknik Pomodoro! Belajar sekejap tapi fokus.', en: 'The Pomodoro technique! Short, focused bursts.' },
      },
      {
        id: 'p3b',
        trait: 'pendengar',
        xp: GOOD_XP,
        text: { ms: 'Pasang muzik tanpa lirik dan teruskan belajar', en: 'Play music without lyrics and carry on' },
        reaction: { ms: 'Muzik yang tenang membantu sesetengah orang lebih fokus.', en: 'Calm sounds help some people focus.' },
      },
      {
        id: 'p3d',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Balas semua mesej dulu', en: 'Reply to all the messages first' },
        reaction: { ms: 'Lima minit jadi sejam! Jauhkan telefon semasa belajar.', en: 'Five minutes turns into an hour! Keep the phone away while studying.' },
      },
    ],
  },
  {
    id: 'p4',
    title: { ms: 'Malu nak bertanya', en: 'Too shy to ask' },
    situation: {
      ms: 'Cikgu terangkan topik baharu, tapi anda tak faham. Kawan-kawan lain semua senyap.',
      en: "Your teacher explains a new topic you don't understand. Everyone else is quiet.",
    },
    choices: [
      {
        id: 'p4d',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Diam sahaja, nanti fahamlah', en: "Stay quiet, it'll make sense later" },
        reaction: {
          ms: 'Belum tentu... Dengan tutor 1-ke-1, anda boleh tanya apa sahaja tanpa rasa malu!',
          en: 'Sometimes it doesn\'t... With a 1-to-1 tutor, you can ask anything without feeling shy!',
        },
      },
      {
        id: 'p4a',
        trait: 'pemikir',
        xp: GOOD_XP,
        text: { ms: 'Tulis soalan dalam buku dan tanya selepas kelas', en: 'Write the question down and ask after class' },
        reaction: { ms: 'Bila ditulis, soalan jadi lebih jelas. Bijak!', en: 'A written question is a clear question. Smart!' },
      },
      {
        id: 'p4b',
        trait: 'sosial',
        xp: GOOD_XP,
        text: { ms: 'Angkat tangan, mesti ada orang lain yang keliru juga', en: 'Raise your hand, others are probably confused too' },
        reaction: { ms: 'Berani! Kawan-kawan pun lega sebab anda bertanya.', en: 'Brave! Your classmates are glad you asked.' },
      },
      {
        id: 'p4c',
        trait: 'pendengar',
        xp: GOOD_XP,
        text: { ms: 'Dengar betul-betul dan ulang penerangan cikgu dalam kepala', en: "Listen closely and replay the explanation in your head" },
        reaction: { ms: 'Mendengar dengan teliti ialah kemahiran yang hebat!', en: 'Active listening is a great skill!' },
      },
    ],
  },
  {
    id: 'p5',
    title: { ms: 'Markah ujian rendah', en: 'A low test mark' },
    situation: {
      ms: 'Keputusan ujian keluar. Markah Matematik anda lebih rendah daripada yang anda harapkan.',
      en: 'Test results are out. Your Maths mark is lower than you hoped.',
    },
    choices: [
      {
        id: 'p5a',
        trait: 'pemikir',
        xp: GOOD_XP,
        text: { ms: 'Semak setiap kesilapan dan tulis cara yang betul', en: 'Go through each mistake and write the right way' },
        reaction: { ms: 'Kesilapan ialah guru yang terbaik!', en: 'Mistakes are the best teachers!' },
      },
      {
        id: 'p5b',
        trait: 'visual',
        xp: GOOD_XP,
        text: { ms: 'Buat carta kemajuan dan tetapkan sasaran untuk ujian akan datang', en: 'Make a progress chart and set a target for the next test' },
        reaction: { ms: 'Nampak sasaran, lebih bersemangat!', en: 'Seeing your target keeps you motivated!' },
      },
      {
        id: 'p5d',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Sembunyikan kertas ujian daripada ibu bapa', en: 'Hide the test paper from your parents' },
        reaction: { ms: 'Hmm... Ibu bapa mahu membantu. Tunjukkan dan bincang bersama!', en: 'Hmm... Your parents want to help. Show them and talk it through!' },
      },
      {
        id: 'p5c',
        trait: 'aktif',
        xp: GOOD_XP,
        text: { ms: 'Buat 5 latihan setiap hari sampai yakin', en: 'Do 5 practice questions daily until confident' },
        reaction: { ms: 'Alah bisa tegal biasa!', en: 'Practice makes perfect!' },
      },
    ],
  },
]

export const TRAIT_ORDER_B: Trait[] = ['visual', 'pendengar', 'aktif', 'pemikir', 'sosial']

export const PERSONALITIES_B: Record<'visual' | 'pendengar' | 'aktif' | 'pemikir' | 'sosial', { name: string; tagline: Txt; description: Txt }> = {
  visual: {
    name: 'Pelajar Visual',
    tagline: { ms: 'Belajar dengan gambar & warna', en: 'Learns with pictures & colour' },
    description: {
      ms: 'Anda paling mudah faham melalui gambar, warna dan peta minda. Lukis apa yang anda pelajari!',
      en: 'Your brain loves pictures, colours and mind maps. Draw what you learn!',
    },
  },
  pendengar: {
    name: 'Pelajar Pendengar',
    tagline: { ms: 'Belajar dengan mendengar', en: 'Learns by listening' },
    description: {
      ms: 'Anda mudah ingat apa yang anda dengar dan sebut. Baca dengan kuat dan berbincang!',
      en: 'You remember what you hear and say. Read aloud and talk it through!',
    },
  },
  aktif: {
    name: 'Pelajar Aktif',
    tagline: { ms: 'Belajar sambil buat', en: 'Learns by doing' },
    description: {
      ms: 'Anda paling cepat faham bila bergerak dan mencuba sendiri. Latihan ialah kuncinya!',
      en: 'You learn best by moving and trying things yourself. Practice is the key!',
    },
  },
  pemikir: {
    name: 'Pelajar Pemikir',
    tagline: { ms: 'Belajar dengan membaca & menulis', en: 'Learns by reading & writing' },
    description: {
      ms: 'Anda suka memahami sesuatu secara mendalam. Nota dan soalan yang anda buat sendiri ialah kekuatan anda!',
      en: 'You like to understand deeply. Your own notes and questions make you strong!',
    },
  },
  sosial: {
    name: 'Pelajar Sosial',
    tagline: { ms: 'Belajar bersama orang lain', en: 'Learns with others' },
    description: {
      ms: 'Anda cepat faham bila belajar dengan orang lain. Tutor 1-ke-1 sangat sesuai untuk anda!',
      en: 'You understand fastest when learning with others. A 1-to-1 tutor suits you perfectly!',
    },
  },
}

/** Two study habits per learner type, shown in the mini report. */
export const STYLE_TIPS: Record<'visual' | 'pendengar' | 'aktif' | 'pemikir' | 'sosial', Txt[]> = {
  visual: [
    { ms: 'Lukis peta minda berwarna untuk setiap bab.', en: 'Draw a colourful mind map for each chapter.' },
    { ms: 'Tonton video pendek tentang topik sebelum kelas.', en: 'Watch a short video on the topic before class.' },
  ],
  pendengar: [
    { ms: 'Baca nota dengan kuat, atau rakam suara anda membaca nota.', en: 'Read notes aloud or record voice notes.' },
    { ms: 'Terangkan topik kepada ahli keluarga.', en: 'Explain the topic to someone at home.' },
  ],
  aktif: [
    { ms: 'Belajar 25 minit, kemudian rehat 5 minit.', en: 'Study for 25 minutes, then take a 5-minute break.' },
    { ms: 'Guna kad imbas dan buat latihan setiap hari.', en: 'Use flashcards and do practice every day.' },
  ],
  pemikir: [
    { ms: 'Tulis ringkasan satu muka surat untuk setiap bab.', en: 'Write a one-page summary of each chapter.' },
    { ms: 'Bina soalan sendiri, kemudian cuba jawab.', en: 'Make up your own questions and answer them.' },
  ],
  sosial: [
    { ms: 'Bentuk kumpulan belajar kecil dengan kawan.', en: 'Start a small study group with friends.' },
    { ms: 'Tanya soalan kepada tutor setiap minggu.', en: 'Ask a tutor your questions every week.' },
  ],
}
