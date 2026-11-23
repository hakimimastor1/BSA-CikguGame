import type { Role, StoryScene, Trait, Txt } from '../types'

export const STORY_INTRO: Record<'learner' | 'tutor', { title: Txt; body: Txt }> = {
  learner: {
    title: { ms: 'Hari ini, anda jadi cikgu!', en: "Today, you're the cikgu!" },
    body: {
      ms: 'Pilih tindakan terbaik dalam 5 situasi kelas, kemudian tanda 8 jawapan murid dalam 45 saat. Di hujung, anda tahu jenis cikgu anda.',
      en: "Choose the best move in 5 class situations, then mark 8 pupils' answers in 45 seconds. At the end you find out your teacher type.",
    },
  },
  tutor: {
    title: { ms: 'Hari pertama anda sebagai tutor BSA', en: 'Your first day as a BSA tutor' },
    body: {
      ms: 'Pilih apa yang anda buat dalam 5 situasi sebenar tutor BSA, kemudian tanda 8 jawapan murid dalam 45 saat. Di hujung, anda tahu jenis cikgu anda.',
      en: "Choose what you would do in 5 real BSA tutor moments, then mark 8 pupils' answers in 45 seconds. At the end you find out your teacher type.",
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
      ms: 'Kelas dah bermula, tapi kamera Aiman tertutup dan dia diam sahaja. Apa yang anda buat?',
      en: "Class begins! Aiman's camera is off and he hasn't said a word. What do you do?",
    },
    choices: [
      {
        id: 's1a',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Panggil nama Aiman dan tanya kartun kegemarannya', en: 'Greet Aiman by name & ask about his favourite cartoon' },
        reaction: {
          ms: 'Aiman ketawa dan buka kamera! Murid rasa dihargai bila cikgu ambil tahu tentang mereka.',
          en: 'Aiman laughs and turns his camera on! Pupils feel valued when their cikgu knows them.',
        },
      },
      {
        id: 's1d',
        trait: 'disiplin',
        xp: GOOD_XP,
        text: { ms: 'Tetapkan peraturan kelas: kamera mesti dibuka, jawab bila dipanggil', en: 'Set class rules: cameras on, answer when called' },
        reaction: {
          ms: 'Aiman buka kamera dan duduk tegak! Peraturan yang jelas dari awal menjadikan kelas lebih teratur.',
          en: 'Aiman turns his camera on and sits up! Clear rules from the start keep class on track.',
        },
      },
      {
        id: 's1b',
        trait: null,
        xp: OKAY_XP,
        text: { ms: 'Teruskan mengajar, tegur dia di akhir kelas', en: 'Keep teaching and check on him at the end' },
        reaction: {
          ms: 'Boleh juga, tapi Aiman dah terlepas separuh kelas. Libatkan murid sejak minit pertama.',
          en: 'That works, but Aiman missed half the class. Involve pupils from the first minute.',
        },
      },
      {
        id: 's1c',
        trait: 'kreatif',
        xp: GOOD_XP,
        text: { ms: 'Mulakan permainan teka gambar di papan putih', en: 'Start a guess-the-drawing game on the whiteboard' },
        reaction: {
          ms: 'Aiman terus ikut melukis! Aktiviti ringkas buat murid hilang rasa malu.',
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
        text: { ms: 'Lukis rajah kaitan: pecahan → perpuluhan → peratus → diskaun jualan', en: 'Draw a map: fractions → decimals → percentages → sale discounts' },
        reaction: {
          ms: '“Oh, rupanya semua berkait!” Bila murid nampak gambaran keseluruhan, mereka lebih yakin.',
          en: '“Oh, it all connects!” When pupils see the big picture, they feel more confident.',
        },
      },
      {
        id: 's2b',
        trait: null,
        xp: OKAY_XP,
        text: { ms: '“Sebab ia ada dalam silibus. Jom kita sambung.”', en: '“Because it\'s in the syllabus. Let\'s continue.”' },
        reaction: {
          ms: 'Betul, tapi murid belajar lebih baik bila mereka faham kenapa ia penting.',
          en: 'True, but pupils learn better when they understand why it matters.',
        },
      },
      {
        id: 's2c',
        trait: 'inspirasi',
        xp: GOOD_XP,
        text: { ms: 'Tunjuk cara bahagi pizza sama rata kepada 8 orang kawan', en: 'Show how to share a pizza fairly among 8 friends' },
        reaction: {
          ms: 'Mata murid terus bersinar! Contoh dalam kehidupan sebenar buat ilmu lebih bermakna.',
          en: 'Their eyes light up! Real-life examples make learning meaningful.',
        },
      },
    ],
  },
  {
    id: 's3',
    title: { ms: 'Mesej daripada ibu bapa', en: 'A message from a parent' },
    situation: {
      ms: 'Ibu Siti hantar WhatsApp: “Cikgu, kenapa markah Siti turun?”',
      en: "Siti's mum sends a WhatsApp: “Cikgu, why have Siti's marks dropped?”",
    },
    choices: [
      {
        id: 's3a',
        trait: null,
        xp: OKAY_XP,
        text: { ms: '“Saya akan cuba lebih gigih, puan.”', en: '“I\'ll try harder, ma\'am.”' },
        reaction: {
          ms: 'Sopan, tapi ibu bapa mahu tahu langkah seterusnya. Beri pelan yang jelas.',
          en: 'Polite, but parents want to know the next step. Give a clear plan.',
        },
      },
      {
        id: 's3b',
        trait: 'strategik',
        xp: GOOD_XP,
        text: { ms: 'Kongsi pelan 4 minggu dengan sasaran mingguan', en: 'Share a 4-week plan with a goal for each week' },
        reaction: {
          ms: 'Ibu Siti lega! Pelan yang jelas membina kepercayaan ibu bapa.',
          en: "Siti's mum is relieved! A clear plan builds parents' trust.",
        },
      },
      {
        id: 's3c',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Dengar dulu, kemudian tanya bagaimana keadaan Siti di sekolah', en: 'Listen first, and ask how Siti has been feeling at school' },
        reaction: {
          ms: 'Rupanya Siti baru bertukar kelas. Memahami murid ialah langkah pertama untuk membantu.',
          en: 'Turns out Siti just changed classes. Understanding the pupil is the first step to helping.',
        },
      },
      {
        id: 's3d',
        trait: 'disiplin',
        xp: GOOD_XP,
        text: { ms: 'Buat jadual latihan harian dan semak kerja Siti setiap minggu', en: "Set a daily practice timetable and check Siti's work every week" },
        reaction: {
          ms: 'Ibu Siti setuju! Rutin yang konsisten ialah kunci untuk markah naik.',
          en: "Siti's mum loves it! A steady routine is the key to better marks.",
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
        text: { ms: 'Rehat 2 minit: kuiz pantas sambil berdiri', en: '2-minute brain break: a quick stand-up quiz' },
        reaction: {
          ms: 'Danish kembali segar! Bergerak dan bermain menyegarkan otak yang penat.',
          en: 'Danish perks up! Movement and games wake up a tired brain.',
        },
      },
      {
        id: 's4b',
        trait: 'inspirasi',
        xp: GOOD_XP,
        text: { ms: 'Ceritakan tentang saintis muda Malaysia yang minat subjek ini', en: 'Tell him about a young Malaysian scientist who loved this subject' },
        reaction: {
          ms: 'Danish teruja: “Saya pun nak jadi macam dia!” Inspirasi buat murid bersemangat untuk belajar.',
          en: 'Danish is excited: “I want to be like her!” Inspiration fuels learning.',
        },
      },
      {
        id: 's4d',
        trait: 'disiplin',
        xp: GOOD_XP,
        text: { ms: 'Tetapkan sasaran: siapkan 5 soalan dulu, baru rehat', en: 'Set a target: finish 5 questions first, then a break' },
        reaction: {
          ms: 'Danish fokus untuk capai sasaran, dan rasa bangga bila siap!',
          en: "Danish focuses to hit the target, and feels proud when he's done!",
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
      ms: 'Kelas hari ini dah tamat. Apa langkah anda seterusnya?',
      en: 'Your first day is almost done! What do you do before the next class?',
    },
    choices: [
      {
        id: 's5a',
        trait: 'penyayang',
        xp: GOOD_XP,
        text: { ms: 'Hantar mesej pujian ringkas kepada murid', en: 'Send your pupil a short note of praise' },
        reaction: {
          ms: 'Murid tersenyum sepanjang hari. Pujian kecil, kesan besar!',
          en: 'Your pupil smiles all the way home. Small praise, big impact!',
        },
      },
      {
        id: 's5b',
        trait: 'strategik',
        xp: GOOD_XP,
        text: { ms: 'Rancang kelas seterusnya berdasarkan kesilapan hari ini', en: "Plan the next lesson around today's mistakes" },
        reaction: {
          ms: 'Bijak! Kesilapan hari ini jadi panduan untuk kelas akan datang.',
          en: "Smart! Today's mistakes are the map for tomorrow's class.",
        },
      },
      {
        id: 's5c',
        trait: 'kreatif',
        xp: GOOD_XP,
        text: { ms: 'Sediakan kuiz seronok untuk kelas akan datang', en: 'Create a game quiz to open the next class' },
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
          ms: 'Murid datang dengan banyak soalan. Rasa ingin tahu ialah permulaan ilmu.',
          en: 'Pupils arrive full of questions. Curiosity is where learning begins.',
        },
      },
      {
        id: 's5e',
        trait: 'disiplin',
        xp: GOOD_XP,
        text: { ms: 'Beri kerja rumah ringkas untuk disemak nanti', en: 'Give short homework and check it tomorrow' },
        reaction: {
          ms: 'Murid tahu cikgu akan semak, jadi semua siap! Disiplin kecil, hasil besar.',
          en: "Pupils know you'll check, so everyone finishes! Small habits, big results.",
        },
      },
    ],
  },
]

export const TRAIT_ORDER: Trait[] = ['kreatif', 'penyayang', 'strategik', 'inspirasi', 'disiplin']

export const PERSONALITIES: Record<'kreatif' | 'penyayang' | 'strategik' | 'inspirasi' | 'disiplin', { name: string; tagline: Txt; description: Txt }> = {
  kreatif: {
    name: 'Cikgu Kreatif',
    tagline: { ms: 'Setiap pelajaran jadi permainan', en: 'Every lesson becomes a game' },
    description: {
      ms: 'Anda jadikan setiap pelajaran seperti permainan. Murid seronok sampai tak sedar mereka sedang belajar!',
      en: "You turn every lesson into a game. Pupils don't even notice they're learning!",
    },
  },
  penyayang: {
    name: 'Cikgu Penyayang',
    tagline: { ms: 'Setiap murid rasa dihargai', en: 'Every pupil feels seen' },
    description: {
      ms: 'Dengan anda, setiap murid rasa dihargai dan berani bertanya.',
      en: 'With you, every pupil feels seen and brave enough to ask.',
    },
  },
  strategik: {
    name: 'Cikgu Strategik',
    tagline: { ms: 'Sasaran jelas, keputusan jelas', en: 'Clear goals, clear results' },
    description: {
      ms: 'Sasaran jelas, pelan jelas, keputusan jelas. Murid tahu hala tuju mereka.',
      en: "Clear goals, clear plan, clear results. Pupils know exactly where they're heading.",
    },
  },
  disiplin: {
    name: 'Cikgu Disiplin',
    tagline: { ms: 'Garang sikit, tapi adil', en: 'A bit fierce, always fair' },
    description: {
      ms: 'Kelas anda teratur: peraturan jelas, kerja rumah sentiasa siap. Murid hormat anda, dan keputusan mereka meningkat!',
      en: 'Your class runs like clockwork: clear rules, homework always done. Pupils respect you, and they pass!',
    },
  },
  inspirasi: {
    name: 'Cikgu Inspirasi',
    tagline: { ms: 'Murid cintakan ilmu', en: 'Pupils fall in love with learning' },
    description: {
      ms: 'Anda buat murid cintakan ilmu dan ingin tahu lebih banyak tentang dunia.',
      en: 'You make pupils fall in love with learning and curious about the world.',
    },
  },
}
