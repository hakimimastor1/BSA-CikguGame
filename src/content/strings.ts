import type { Lang, Txt } from '../types'

export const t = (txt: Txt, lang: Lang) => txt[lang]

/** Fill {placeholders} in a string. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export const S = {
  appName: { ms: 'Cikgu Sehari', en: 'Cikgu Sehari' },
  preview: { ms: 'PRATONTON · data tidak disimpan', en: 'PREVIEW · nothing is saved' },
  langSwitch: { ms: 'English', en: 'BM' },
  langSwitchLabel: { ms: 'Tukar ke Bahasa Inggeris', en: 'Switch to Bahasa Melayu' },
  back: { ms: 'Kembali', en: 'Back' },
  next: { ms: 'Seterusnya', en: 'Next' },

  // Welcome
  welcomeKicker: { ms: 'Bright Scholar Academy', en: 'Bright Scholar Academy' },
  welcomeTitle: { ms: 'Jom Main!', en: "Let's Play!" },
  welcomeGames: {
    ms: '2 permainan, 3 minit sahaja: bakal cikgu main Cikgu Sehari, pelajar sekolah main Misi Pelajar Bijak. Skor tertinggi keluar di skrin besar!',
    en: '2 games, 3 minutes: future teachers play Cikgu Sehari, school students play Smart Student Mission. Top scores go on the big screen!',
  },
  welcomeBody: {
    ms: 'Ajar, semak kerja murid dan kenali gaya mengajar anda dalam 3 minit. Skor tertinggi keluar di skrin besar!',
    en: 'Teach, mark your pupil\'s work and discover your cikgu type in 3 minutes. Top scores go on the big screen!',
  },
  welcomeStart: { ms: 'Mula main', en: 'Start playing' },
  welcomePerkTutor: { ms: 'Pelajar & graduan UPSI: jadi tutor BSA · RM25–40/jam', en: 'UPSI grads: tutor with BSA · RM25–40/hr' },
  welcomePerkTrial: { ms: 'Adik-adik sekolah: trial percuma 3 subjek + beg BSA', en: 'School kids: free 3-subject trial + BSA bag' },
  welcomePerkTrialAfter: { ms: 'Pelajar sekolah: kelas trial percuma', en: 'School students: free trial class' },
  rolePelajarHintAfter: { ms: 'Main Misi Pelajar Bijak · trial percuma', en: 'Play Smart Student Mission · free trial' },
  roleIbubapaHintAfter: { ms: 'Untuk anak atau adik · pilih permainan · trial percuma', en: 'For your child or sibling · pick a game · free trial' },
  welcomePerkAll: { ms: 'Semua pemain dapat sticker!', en: 'Every player gets a sticker!' },
  welcomeWebTrial: { ms: 'Nak terus daftar kelas trial tanpa main?', en: 'Want to book a trial class without playing?' },
  welcomeWebTrialLink: {
    ms: 'Daftar di laman web BSA (tekan "Claim FREE Trial")',
    en: 'Register on the BSA website (tap "Claim FREE Trial")',
  },

  // Role
  roleTitle: { ms: 'Saya…', en: 'I am…' },
  rolePelajar: { ms: 'Pelajar sekolah', en: 'A school student' },
  rolePelajarHint: { ms: 'Main Misi Pelajar Bijak · trial percuma + beg', en: 'Play Smart Student Mission · free trial + bag' },
  roleIbubapa: { ms: 'Ibu bapa / keluarga', en: 'A parent / family' },
  roleIbubapaHint: { ms: 'Untuk anak atau adik · pilih permainan · trial percuma + beg', en: 'For your child or sibling · pick a game · free trial + bag' },
  roleCikgu: { ms: 'Pelajar / graduan UPSI', en: 'A UPSI student / graduate' },
  roleCikguHint: { ms: 'Main Cikgu Sehari · jadi tutor BSA, RM25–40/jam', en: 'Play Cikgu Sehari · tutor with BSA, RM25–40/hr' },

  // Game choice (families)
  gamePickTitle: { ms: 'Nak main sebagai…', en: 'Play as…' },
  gamePickCikgu: { ms: 'Cikgu', en: 'The cikgu' },
  gamePickCikguHint: { ms: 'Cikgu Sehari: uji diri, mampukah anda mengajar anak sendiri?', en: 'Cikgu Sehari: could you teach your child?' },
  gamePickPelajar: { ms: 'Pelajar', en: 'The student' },
  gamePickPelajarHint: { ms: 'Misi Pelajar Bijak: cuba jawab soalan ikut tahap anak anda', en: "Smart Student Mission: try your child's questions" },

  // Level
  levelTitlePelajar: { ms: 'Anda di tahap mana?', en: 'Which level are you in?' },
  levelTitleIbubapa: { ms: 'Anak atau adik anda di tahap mana?', en: 'What level is your child or sibling in?' },
  levelTitleCikgu: { ms: 'Anda nak mengajar tahap mana?', en: 'Which level would you teach?' },
  teachSubjectsTitle: { ms: 'Pilih subjek yang anda boleh ajar (sehingga 3)', en: 'Pick subjects you could teach (up to 3)' },

  // Nickname
  nickTitle: { ms: 'Nama gelaran anda', en: 'Your nickname' },
  nickBody: { ms: 'Nama ini akan keluar di skrin besar booth BSA.', en: 'This name shows on the big screen at the BSA booth.' },
  nickPlaceholder: { ms: 'cth. Cikgu Ceria 27', en: 'e.g. Cikgu Ceria 27' },
  nickPlaceholderB: { ms: 'cth. Juara Bijak 27', en: 'e.g. Juara Bijak 27' },
  nickSuggest: { ms: 'Cadangkan nama', en: 'Suggest a name' },
  nickBad: { ms: 'Nama ini tak boleh digunakan. Cuba nama lain.', en: "That name can't be used. Try another one." },
  nickShort: { ms: 'Sekurang-kurangnya 3 huruf.', en: 'At least 3 letters.' },
  nickGo: { ms: 'Jom mula!', en: "Let's go!" },

  // Story
  sceneOf: { ms: 'Situasi {n} / {total}', en: 'Situation {n} / {total}' },
  tipCikgu: { ms: 'Tip cikgu', en: 'Cikgu tip' },
  continue: { ms: 'Teruskan', en: 'Continue' },
  xpGained: { ms: '+{xp} XP', en: '+{xp} XP' },

  // Kuiz Kilat (Game B)
  quizTitle: { ms: 'Kuiz Kilat!', en: 'Quick Quiz!' },
  quizBody: {
    ms: 'Jawapan ini betul atau salah? Jawab sendiri. Lebih cepat dan tepat, lebih banyak XP. Anda ada satu bantuan: Tanya Cikgu BSA!',
    en: 'Right or wrong? Answer it yourself. Fast and accurate earns more XP. You get one help: Ask a BSA tutor!',
  },
  quizStart: { ms: 'Mula kuiz', en: 'Start the quiz' },
  quizAnswer: { ms: 'Jawapan', en: 'Answer' },
  quizActuallyRight: { ms: 'Jawapan itu sebenarnya betul!', en: 'That answer was actually right!' },
  hintBtn: { ms: 'Tanya Cikgu BSA', en: 'Ask a BSA tutor' },
  hintText: { ms: 'Cikgu BSA: jawapan yang betul ialah "{fix}".', en: 'BSA tutor: the right answer is "{fix}".' },
  hintUsed: { ms: 'Bantuan sudah digunakan', en: 'Help used' },
  quizDone: { ms: 'Kuiz selesai!', en: 'Quiz done!' },
  quizCorrect: { ms: '{n} daripada {total} betul', en: '{n} of {total} correct' },

  // Semak Kerja
  semakTitle: { ms: 'Cabaran Semak Kerja!', en: 'Marking Challenge!' },
  semakBody: {
    ms: 'Murid anda dah siap buat latihan. Tandakan betul (✓) atau salah (✗). Lebih cepat dan tepat, lebih banyak XP!',
    en: "Your pupil has finished their exercise. Right (✓) or wrong (✗)? Fast and accurate earns more XP!",
  },
  semakStart: { ms: 'Mula semak', en: 'Start marking' },
  semakPupilAnswer: { ms: 'Jawapan murid', en: "Pupil's answer" },
  semakRight: { ms: 'Betul', en: 'Right' },
  semakWrong: { ms: 'Salah', en: 'Wrong' },
  semakStreak: { ms: '{n} berturut-turut!', en: '{n} in a row!' },
  semakTimeUp: { ms: 'Masa tamat!', en: "Time's up!" },
  semakItem: { ms: '{n} / {total}', en: '{n} / {total}' },
  semakSeconds: { ms: '{s} saat', en: '{s}s' },
  semakDone: { ms: 'Semakan selesai!', en: 'All marked!' },
  semakCorrectMarks: { ms: '{n} daripada {total} betul', en: '{n} of {total} marked correctly' },
  semakSeeResult: { ms: 'Lihat keputusan', en: 'See my result' },

  // Result
  resultKicker: { ms: 'Anda seorang…', en: 'You are…' },
  resultXp: { ms: 'Jumlah XP', en: 'Total XP' },
  resultStrongest: { ms: 'Subjek terkuat', en: 'Strongest subject' },
  resultLevelUp: { ms: 'Subjek untuk naik level', en: 'Subjects to level up' },
  resultAllGood: { ms: 'Semua betul. Hebat!', en: 'All correct. Amazing!' },
  resultTutorPay: {
    ms: 'Tutor BSA untuk {level} dibayar RM{pay} sejam, setiap minggu.',
    en: 'BSA tutors for {level} earn RM{pay}/hour, paid weekly.',
  },
  resultRank: { ms: 'No. {rank} hari ini', en: 'No. {rank} today' },
  resultRankBoard: { ms: 'No. {rank} di papan skor', en: 'No. {rank} on the board' },
  resultRankOf: { ms: 'daripada {n} pemain {game}', en: 'of {n} {game} players' },
  resultShare: { ms: 'Kongsi kad saya', en: 'Share my card' },
  resultSharing: { ms: 'Menyediakan kad…', en: 'Preparing card…' },
  resultClaim: { ms: 'Tuntut trial percuma 3 subjek', en: 'Claim free trial for 3 subjects' },
  resultJoin: { ms: 'Jom jadi cikgu BSA', en: 'Become a BSA cikgu' },
  styleTipsTitle: { ms: 'Cara belajar terbaik untuk anda', en: 'How you learn best' },
  reviewYouAnsweredRight: { ms: 'Anda jawab betul', en: 'You got it right' },
  reviewYouAnsweredWrong: { ms: 'Anda tersilap', en: 'You got it wrong' },
  reviewAnswer: { ms: 'Jawapan', en: 'Answer' },
  reviewAnswerRight: { ms: 'Jawapan itu memang betul', en: 'That answer was right' },
  reviewHinted: { ms: 'dengan bantuan Cikgu BSA', en: 'with help from a BSA tutor' },
  reportTitle: { ms: 'Laporan mini', en: 'Mini report' },
  reportBody: { ms: 'Tunjukkan kepada ibu bapa anda!', en: 'Show this to your parents!' },
  reportTips: { ms: 'Tip untuk naik level', en: 'Tips to level up' },
  reportAllRight: { ms: 'Semua betul! Teruskan usaha.', en: 'All correct! Keep it up.' },
  reviewTitle: { ms: 'Semak semula jawapan', en: 'Review the answers' },
  reviewPupil: { ms: 'Jawapan murid', en: "Pupil's answer" },
  reviewCorrect: { ms: 'Jawapan betul', en: 'Correct answer' },
  reviewYouRight: { ms: 'Anda tanda dengan betul', en: 'You marked it right' },
  reviewYouWrong: { ms: 'Anda tersilap tanda', en: 'You marked it wrong' },
  reviewNoTime: { ms: 'Tidak sempat ditanda', en: 'Not marked in time' },
  reviewPupilRight: { ms: 'Jawapan murid memang betul', en: "The pupil's answer was right" },
  trialWorth: { ms: 'bernilai RM{value}', en: 'worth RM{value}' },
  resultSticker: { ms: 'Tunjukkan skrin ini di booth BSA untuk dapatkan sticker percuma!', en: 'Show this screen at the BSA booth for a free sticker!' },
  resultPlayAgain: { ms: 'Main semula', en: 'Play again' },
  shareTextB: {
    ms: 'Saya seorang {name}! Dapat {xp} XP dalam Misi Pelajar Bijak. Jom main di booth Bright Scholar Academy, {event}.',
    en: "I'm a {name} with {xp} XP in Smart Student Mission! Play at the Bright Scholar Academy booth, {event}.",
  },
  shareText: {
    ms: 'Saya seorang {name}! Dapat {xp} XP dalam Cikgu Sehari. Jom main di booth Bright Scholar Academy, {event}.',
    en: "I'm {name} with {xp} XP in Cikgu Sehari! Play at the Bright Scholar Academy booth, {event}.",
  },

  // Sign-up
  signupTitleLearner: { ms: 'Tuntut trial percuma anda', en: 'Claim your free trial' },
  signupBodyLearner: {
    ms: 'Kelas online 1-ke-1, 1 jam bagi setiap subjek. Kami akan WhatsApp anda untuk tetapkan masa.',
    en: "1-to-1 online classes, 1 hour per subject. We'll WhatsApp you to set a time.",
  },
  signupTitleTutor: { ms: 'Mohon jadi tutor BSA', en: 'Apply to be a BSA tutor' },
  signupBodyTutor: {
    ms: 'Isi sedikit maklumat dan pasukan BSA akan menghubungi anda melalui WhatsApp.',
    en: 'Share a few details and the BSA team will contact you on WhatsApp.',
  },
  fName: { ms: 'Nama penuh', en: 'Full name' },
  fNameChild: { ms: 'Nama anak / adik', en: "Child or sibling's name" },
  fParentName: { ms: 'Nama ibu bapa / penjaga', en: "Parent / guardian's name" },
  fYourName: { ms: 'Nama anda', en: 'Your name' },
  fWhatsapp: { ms: 'No. WhatsApp', en: 'WhatsApp number' },
  fParentWhatsapp: { ms: 'No. WhatsApp ibu bapa / penjaga', en: "Parent / guardian's WhatsApp" },
  fParentWhatsappHint: {
    ms: 'Untuk pelajar bawah 18 tahun, kami hubungi ibu bapa atau penjaga.',
    en: 'For students under 18, we contact a parent or guardian.',
  },
  fUnder18: { ms: 'Saya berumur bawah 18 tahun', en: "I'm under 18" },
  fSchool: { ms: 'Sekolah', en: 'School' },
  fChildSchool: { ms: 'Sekolah anak / adik', en: "Child's school" },
  fLevelNow: { ms: 'Tahap anda sekarang ({year})', en: 'Your level now ({year})' },
  fChildLevelNow: { ms: 'Tahap anak / adik sekarang ({year})', en: "Child's level now ({year})" },
  fLevelNext: { ms: 'Kelas anda pada {year}', en: 'Your class in {year}' },
  fChildLevelNext: { ms: 'Kelas anak / adik pada {year}', en: "Child's class in {year}" },
  fLevelNextHint: {
    ms: 'Trial dan kelas BSA ikut kelas {year}. Kami dah isi automatik; tukar kalau perlu.',
    en: 'The trial and BSA classes follow the {year} class. We filled it in; change it if needed.',
  },
  fArea: { ms: 'Kawasan (bandar / negeri)', en: 'Area (town / state)' },
  fTrialSubjects: { ms: 'Pilih 3 subjek trial', en: 'Pick 3 trial subjects' },
  fTrialSubjectsHint: { ms: 'Kami dah pilihkan subjek yang paling perlu dibantu. Anda boleh tukar.', en: "We've picked your level-up subjects. Feel free to change them." },
  fStatus: { ms: 'Saya…', en: "I'm…" },
  fStatusUpsi: { ms: 'Pelajar UPSI', en: 'A UPSI student' },
  fStatusGrad: { ms: 'Graduan / bekerja', en: 'A graduate / working' },
  fSemester: { ms: 'Semester', en: 'Semester' },
  fCgpa: { ms: 'CGPA', en: 'CGPA' },
  fQualification: { ms: 'Kelayakan tertinggi', en: 'Highest qualification' },
  fCourse: { ms: 'Program / bidang', en: 'Programme / field' },
  fTeachSubjects: { ms: 'Subjek yang boleh diajar', en: 'Subjects you can teach' },
  fAvailability: { ms: 'Masa lapang', en: 'When are you free?' },
  avWeekday: { ms: 'Hari biasa (malam)', en: 'Weekday evenings' },
  avWeekend: { ms: 'Hujung minggu', en: 'Weekends' },
  avFlexible: { ms: 'Fleksibel', en: 'Flexible' },
  fConsent: {
    ms: 'Saya bersetuju Bright Scholar Academy menyimpan dan menggunakan maklumat ini untuk menghubungi saya tentang tawaran ini, mengikut Akta Perlindungan Data Peribadi 2010.',
    en: 'I agree that Bright Scholar Academy may keep and use these details to contact me about this offer, under the Personal Data Protection Act 2010.',
  },
  fMarketing: {
    ms: 'Saya mahu terima tawaran dan berita lain daripada BSA (tidak wajib)',
    en: 'Send me other BSA offers and news (optional)',
  },
  fRequired: { ms: 'Wajib diisi', en: 'Required' },
  fPhoneInvalid: { ms: 'Masukkan nombor telefon Malaysia, cth. 012-345 6789', en: 'Enter a Malaysian phone number, e.g. 012-345 6789' },
  fPick3: { ms: 'Pilih 3 subjek', en: 'Pick 3 subjects' },
  fPickAtLeast1: { ms: 'Pilih sekurang-kurangnya 1 subjek', en: 'Pick at least 1 subject' },
  fConsentNeeded: { ms: 'Sila tandakan persetujuan untuk teruskan', en: 'Please tick the consent box to continue' },
  signupSaving: { ms: 'Menyimpan…', en: 'Saving…' },
  signupError: {
    ms: 'Talian lemah, maklumat belum disimpan. Cuba lagi, atau teruskan dan tuntut terus di WhatsApp.',
    en: "Weak signal, your details aren't saved yet. Try again, or carry on and claim straight on WhatsApp.",
  },
  signupRetry: { ms: 'Cuba lagi', en: 'Try again' },
  signupSkip: { ms: 'Teruskan ke WhatsApp', en: 'Continue to WhatsApp' },
  submitLearner: { ms: 'Dapatkan kod trial', en: 'Get my trial code' },
  submitTutor: { ms: 'Hantar permohonan', en: 'Send my application' },

  // Offer
  offerEndedTitle: { ms: 'Terima kasih kerana bermain!', en: 'Thanks for playing!' },
  offerEnded: {
    ms: 'Tawaran PESKON UPSI 2026 telah tamat pada 2 Disember 2026. Anda masih boleh cuba kelas trial percuma BSA: WhatsApp kami untuk tetapkan masa.',
    en: 'The PESKON UPSI 2026 offer ended on 2 December 2026. You can still try a free BSA trial class: WhatsApp us to set a time.',
  },
  offerEndedClaim: { ms: 'WhatsApp BSA untuk trial', en: 'WhatsApp BSA for a trial' },
  waLearnerAfter: {
    ms: 'Hi BSA! Saya nak cuba kelas trial percuma.\n{details}\nRujukan: {ref}',
    en: "Hi BSA! I'd like to try a free trial class.\n{details}\nReference: {ref}",
  },
  offerTitle: { ms: 'Tahniah! Trial anda dah sedia', en: 'Congrats! Your trial is ready' },
  offerExisting: {
    ms: 'Pendaftaran ini sudah kami terima tadi, jadi rujukan yang sama digunakan.',
    en: 'We already received this sign-up, so the same reference is used.',
  },
  offerCodeLabel: { ms: 'Kod promosi', en: 'Promo code' },
  offerWhat: { ms: 'Trial percuma 3 subjek · kelas online 1-ke-1', en: 'Free trial for 3 subjects · 1-to-1 online classes' },
  offerValid: { ms: 'Sah sehingga {date}', en: 'Valid until {date}' },
  offerRef: { ms: 'No. rujukan', en: 'Reference no.' },
  offerCopy: { ms: 'Salin kod', en: 'Copy code' },
  offerCopied: { ms: 'Disalin!', en: 'Copied!' },
  offerClaim: { ms: 'Tuntut di WhatsApp', en: 'Claim on WhatsApp' },
  offerBooth: {
    ms: 'Tunjukkan skrin ini di booth BSA untuk ambil beg BSA dan sticker (selagi stok ada).',
    en: 'Show this screen at the BSA booth to collect your BSA bag and sticker (while stocks last).',
  },
  offerTutorBooth: {
    ms: 'Tunjukkan skrin ini di booth BSA untuk ambil sticker percuma.',
    en: 'Show this screen at the BSA booth for a free sticker.',
  },
  offerTutorTitle: { ms: 'Terima kasih, bakal cikgu!', en: 'Thank you, future cikgu!' },
  offerTutorBody: {
    ms: 'Pasukan BSA akan menghubungi anda melalui WhatsApp. Untuk proses lebih cepat, lengkapkan pendaftaran tutor di laman web BSA.',
    en: 'The BSA team will WhatsApp you. To speed things up, complete the tutor registration on the BSA website.',
  },
  offerTutorRegister: { ms: 'Daftar di laman web', en: 'Register on the website' },
  offerTutorWhatsapp: { ms: 'WhatsApp BSA', en: 'WhatsApp BSA' },
  offerTutorPerks: {
    ms: 'RM25–40/jam · bayaran mingguan · masa fleksibel · online atau di rumah murid',
    en: "RM25–40/hour · paid weekly · flexible hours · online or at the pupil's home",
  },
  waLearner: {
    ms: 'Hi BSA! Saya nak tuntut kelas trial percuma 3 subjek dengan kod {code}.\n{details}\nRujukan: {ref}',
    en: "Hi BSA! I'd like to claim the free 3-subject trial with code {code}.\n{details}\nReference: {ref}",
  },
  // Lines of the trial claim message (only the ones the visitor filled in are sent).
  waName: { ms: 'Nama', en: 'Name' },
  waChild: { ms: 'Nama anak', en: "Child's name" },
  waParent: { ms: 'Ibu bapa / penjaga', en: 'Parent / guardian' },
  waLevel: { ms: 'Tahap {now}', en: 'Level {now}' },
  waLevelNext: { ms: 'Kelas {next}', en: 'Class {next}' },
  waSchool: { ms: 'Sekolah', en: 'School' },
  waSubjects: { ms: 'Subjek', en: 'Subjects' },
  waTutor: {
    ms: 'Hi BSA! Saya {name}. Saya berminat menjadi tutor BSA ({subjects}, {level}). Rujukan: {ref}',
    en: "Hi BSA! I'm {name} and I'd like to become a BSA tutor ({subjects}, {level}). Reference: {ref}",
  },
} satisfies Record<string, Txt>
