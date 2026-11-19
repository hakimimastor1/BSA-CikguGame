import type { Role, StoryScene, Trait, Txt } from '../types'

export const STORY_INTRO: Record<'learner' | 'tutor', { title: Txt; body: Txt }> = {
  learner: {
    title: { ms: 'Hari ini, anda cikgunya!', en: "Today, you're the cikgu!" },
    body: {
      ms: '5 situasi kelas + 1 cabaran semak kerja. Pilih apa yang cikgu hebat akan buat!',
      en: '5 class situations + 1 marking challenge. Choose what a great cikgu would do!',
    },
  },
  tutor: {
    title: { ms: 'Hari pertama anda sebagai tutor BSA', en: 'Your first day as a BSA tutor' },
    body: {
      ms: '5 situasi sebenar tutor BSA + 1 cabaran semak kerja. Jom lihat cikgu jenis apa anda!',
      en: "5 real BSA tutor moments + 1 marking challenge. Let's see what kind of cikgu you are!",
    },
  },
}

export const introFor = (role: Role) => STORY_INTRO[role === 'cikgu' ? 'tutor' : 'learner']

export const GOOD_XP = 30
export const OKAY_XP = 10

export const STORY: StoryScene[] = [
  {
    id: 's1',
    title: { ms: 'Kelas online pertama', en: 'Your first online class' },
    situation: {
      ms: 'Kelas bermula! Kamera Aiman tertutup dan dia diam sahaja. Apa anda buat?',
      en: "Class begins! Aiman's camera is off and he hasn't said a word. What do you do?",
    },
    choices: [
      {
        id: 's1a',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Sapa Aiman dengan namanya & tanya kartun kegemarannya', en: 'Greet Aiman by name & ask about his favourite cartoon' },
        reaction: {
          ms: 'Aiman ketawa dan buka kamera! Murid rasa dihargai bila cikgu kenal mereka.',
          en: 'Aiman laughs and turns his camera on! Pupils feel valued when their cikgu knows them.',
        },
      },
      {
        id: 's1b',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Teruskan mengajar, tanya dia di hujung kelas', en: 'Keep teaching and check on him at the end' },
        reaction: {
          ms: 'Boleh, tapi Aiman terlepas separuh kelas. Libatkan murid dari minit pertama.',
          en: 'That works, but Aiman missed half the class. Involve pupils from the first minute.',
        },
      },
      {
        id: 's1c',
        trait: 'kreatif',
        xp: GOOD_XP,
        text: { ms: 'Mulakan permainan teka lukisan di whiteboard', en: 'Start a guess-the-drawing game on the whiteboard' },
        reaction: {
          ms: 'Aiman terus melukis! Aktiviti pendek memecahkan rasa malu.',
          en: 'Aiman starts drawing straight away! A short activity breaks the ice.',
        },
      },
    ],
  },
  {
    id: 's2',
    title: { ms: '“Kenapa kena belajar ni?”', en: '“Why do we learn this?”' },
    situation: {
      ms: 'Murid anda mengeluh, “Cikgu, kenapa kena belajar pecahan? Bosanlah!”',
      en: '“Cikgu, why do we have to learn fractions? So boring!” groans your pupil.',
    },
    choices: [
      {
        id: 's2a',
        trait: 'strategik',
        xp: GOOD_XP,
        text: { ms: 'Lukis peta: pecahan → perpuluhan → peratus → diskaun jualan', en: 'Draw a map: fractions → decimals → percentages → sale discounts' },
        reaction: {
          ms: '“Oh, jadi semua bersambung!” Bila murid nampak gambaran besar, mereka lebih yakin.',
          en: '“Oh, it all connects!” When pupils see the big picture, they feel more confident.',
        },
      },
      {
        id: 's2b',
        trait: null,
        xp: OKAY_XP,
        text: { ms: '“Sebab ia ada dalam silibus. Jom sambung.”', en: '“Because it\'s in the syllabus. Let\'s continue.”' },
        reaction: {
          ms: 'Betul, tapi murid belajar lebih baik bila mereka faham kenapa ia penting.',
          en: 'True, but pupils learn better when they understand why it matters.',
        },
      },
      {
        id: 's2c',
        trait: 'inspirasi',
        xp: GOOD_XP,
        text: { ms: 'Tunjuk cara bahagi pizza sama rata untuk 8 kawan', en: 'Show how to share a pizza fairly among 8 friends' },
        reaction: {
          ms: 'Mata murid bersinar! Contoh dunia sebenar buat ilmu lebih bermakna.',
          en: 'Their eyes light up! Real-life examples make learning meaningful.',
        },
      },
    ],
  },
  {
    id: 's3',
    title: { ms: 'Mesej daripada ibu bapa', en: 'A message from a parent' },
    situation: {
      ms: 'Ibu Siti menghantar WhatsApp: “Cikgu, kenapa markah Siti turun?”',
      en: "Siti's mum sends a WhatsApp: “Cikgu, why have Siti's marks dropped?”",
    },
    choices: [
      {
        id: 's3a',
        trait: null,
        xp: OKAY_XP,
        text: { ms: '“Saya akan cuba lebih lagi, puan.”', en: '“I\'ll try harder, ma\'am.”' },
        reaction: {
          ms: 'Sopan, tapi ibu bapa mahu tahu langkah seterusnya. Beri pelan yang jelas.',
          en: 'Polite, but parents want to know the next step. Give a clear plan.',
        },
      },
      {
        id: 's3b',
        trait: 'strategik',
        xp: GOOD_XP,
        text: { ms: 'Kongsi pelan 4 minggu dengan sasaran setiap minggu', en: 'Share a 4-week plan with a goal for each week' },
        reaction: {
          ms: 'Ibu Siti lega! Pelan yang jelas membina kepercayaan ibu bapa.',
          en: "Siti's mum is relieved! A clear plan builds parents' trust.",
        },
      },
      {
        id: 's3c',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Dengar dulu, dan tanya bagaimana perasaan Siti di sekolah', en: 'Listen first, and ask how Siti has been feeling at school' },
        reaction: {
          ms: 'Rupanya Siti baru bertukar kelas. Memahami murid ialah langkah pertama membantu.',
          en: 'Turns out Siti just changed classes. Understanding the pupil is the first step to helping.',
        },
      },
    ],
  },
  {
    id: 's4',
    title: { ms: 'Kelas di rumah murid', en: 'A home tuition visit' },
    situation: {
      ms: 'Petang Jumaat. Danish penat dan asyik menguap. Masih ada satu bab lagi.',
      en: "Friday afternoon. Danish is tired and keeps yawning. There's still one chapter left.",
    },
    choices: [
      {
        id: 's4a',
        trait: 'kreatif',
        xp: GOOD_XP,
        text: { ms: 'Rehat otak 2 minit: kuiz pantas sambil berdiri', en: '2-minute brain break: a quick stand-up quiz' },
        reaction: {
          ms: 'Danish segar semula! Gerakan dan permainan menghidupkan otak yang penat.',
          en: 'Danish perks up! Movement and games wake up a tired brain.',
        },
      },
      {
        id: 's4b',
        trait: 'inspirasi',
        xp: GOOD_XP,
        text: { ms: 'Cerita tentang saintis muda Malaysia yang suka subjek ini', en: 'Tell him about a young Malaysian scientist who loved this subject' },
        reaction: {
          ms: 'Danish teruja: “Saya pun nak jadi macam dia!” Inspirasi ialah bahan api belajar.',
          en: 'Danish is excited: “I want to be like her!” Inspiration fuels learning.',
        },
      },
      {
        id: 's4c',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Teruskan sampai habis bab, walaupun Danish penat', en: "Push on to finish the chapter, even though he's tired" },
        reaction: {
          ms: 'Bab habis, tapi Danish ingat sedikit sahaja. Kadang-kadang rehat sekejap lebih berkesan.',
          en: 'Chapter done, but Danish remembers little. Sometimes a short break works better.',
        },
      },
    ],
  },
  {
    id: 's5',
    title: { ms: 'Selepas kelas', en: 'After class' },
    situation: {
      ms: 'Hari pertama hampir tamat! Apa anda buat sebelum kelas seterusnya? (Tiada jawapan salah di sini!)',
      en: 'Your first day is almost done! What do you do before the next class? (No wrong answer here!)',
    },
    choices: [
      {
        id: 's5a',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Hantar nota pujian ringkas kepada murid', en: 'Send your pupil a short note of praise' },
        reaction: {
          ms: 'Murid tersenyum sampai ke rumah. Pujian kecil, kesan besar!',
          en: 'Your pupil smiles all the way home. Small praise, big impact!',
        },
      },
      {
        id: 's5b',
        trait: 'strategik',
        xp: GOOD_XP,
        text: { ms: 'Rancang kelas seterusnya berdasarkan kesilapan hari ini', en: "Plan the next lesson around today's mistakes" },
        reaction: {
          ms: 'Bijak! Kesilapan hari ini ialah peta untuk kelas esok.',
          en: "Smart! Today's mistakes are the map for tomorrow's class.",
        },
      },
      {
        id: 's5c',
        trait: 'kreatif',
        xp: GOOD_XP,
        text: { ms: 'Cipta kuiz permainan untuk buka kelas seterusnya', en: 'Create a game quiz to open the next class' },
        reaction: {
          ms: 'Murid tak sabar nak masuk kelas! Permulaan yang seronok buat semua fokus.',
          en: "Pupils can't wait for class! A fun start gets everyone focused.",
        },
      },
      {
        id: 's5d',
        trait: 'inspirasi',
        xp: GOOD_XP,
        text: { ms: 'Cari video menarik tentang topik seterusnya', en: 'Find a cool video about the next topic' },
        reaction: {
          ms: 'Murid datang dengan seribu soalan. Rasa ingin tahu ialah permulaan ilmu.',
          en: 'Pupils arrive full of questions. Curiosity is where learning begins.',
        },
      },
    ],
  },
]

export const TRAIT_ORDER: Trait[] = ['kreatif', 'penyayang', 'strategik', 'inspirasi']

export const PERSONALITIES: Record<Trait, { name: string; tagline: Txt; description: Txt }> = {
  kreatif: {
    name: 'Cikgu Kreatif',
    tagline: { ms: 'Setiap pelajaran jadi permainan', en: 'Every lesson becomes a game' },
    description: {
      ms: 'Anda jadikan setiap pelajaran satu permainan. Murid tak sedar mereka sedang belajar!',
      en: "You turn every lesson into a game. Pupils don't even notice they're learning!",
    },
  },
  penyayang: {
    name: 'Cikgu Penyayang',
    tagline: { ms: 'Setiap murid rasa dihargai', en: 'Every pupil feels seen' },
    description: {
      ms: 'Bersama anda, setiap murid rasa dihargai dan berani bertanya.',
      en: 'With you, every pupil feels seen and brave enough to ask.',
    },
  },
  strategik: {
    name: 'Cikgu Strategik',
    tagline: { ms: 'Sasaran jelas, keputusan jelas', en: 'Clear goals, clear results' },
    description: {
      ms: 'Sasaran jelas, pelan jelas, keputusan jelas. Murid tahu ke mana mereka menuju.',
      en: "Clear goals, clear plan, clear results. Pupils know exactly where they're heading.",
    },
  },
  inspirasi: {
    name: 'Cikgu Inspirasi',
    tagline: { ms: 'Murid jatuh cinta dengan ilmu', en: 'Pupils fall in love with learning' },
    description: {
      ms: 'Anda buat murid jatuh cinta dengan ilmu dan ingin tahu tentang dunia.',
      en: 'You make pupils fall in love with learning and curious about the world.',
    },
  },
}
