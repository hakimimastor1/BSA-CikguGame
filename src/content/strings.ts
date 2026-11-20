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
  welcomeTitle: { ms: 'Jadi Cikgu Sehari!', en: 'Be a Cikgu for a Day!' },
  welcomeBody: {
    ms: 'Ajar, semak kerja murid dan kenali jenis cikgu anda dalam 3 minit. Skor tertinggi masuk skrin!',
    en: 'Teach, mark your pupil\'s work and discover your cikgu type in 3 minutes. Top scores go on the big screen!',
  },
  welcomeStart: { ms: 'Mula main', en: 'Start playing' },
  welcomePerk: { ms: 'Hadiah: trial percuma 3 subjek', en: 'Prize: free trial for 3 subjects' },

  // Role
  roleTitle: { ms: 'Saya…', en: 'I am…' },
  rolePelajar: { ms: 'Pelajar', en: 'A student' },
  rolePelajarHint: { ms: 'Tahun 1 – Tingkatan 5', en: 'Standard 1 – Form 5' },
  roleIbubapa: { ms: 'Ibu bapa', en: 'A parent' },
  roleIbubapaHint: { ms: 'Main untuk anak anda', en: 'Play for your child' },
  roleCikgu: { ms: 'Nak jadi cikgu', en: 'A future cikgu' },
  roleCikguHint: { ms: 'Pelajar UPSI, graduan, pencari kerja', en: 'UPSI student, graduate, job-seeker' },

  // Level
  levelTitlePelajar: { ms: 'Anda di tahap mana?', en: 'Which level are you in?' },
  levelTitleIbubapa: { ms: 'Anak anda di tahap mana?', en: "What level is your child in?" },
  levelTitleCikgu: { ms: 'Tahap mana anda nak ajar?', en: 'Which level would you teach?' },
  teachSubjectsTitle: { ms: 'Pilih subjek yang anda boleh ajar (sehingga 3)', en: 'Pick subjects you could teach (up to 3)' },

  // Nickname
  nickTitle: { ms: 'Nama gelaran anda', en: 'Your nickname' },
  nickBody: { ms: 'Nama ini akan keluar di skrin besar booth BSA.', en: 'This name shows on the big screen at the BSA booth.' },
  nickPlaceholder: { ms: 'cth. Cikgu Ceria 27', en: 'e.g. Cikgu Ceria 27' },
  nickSuggest: { ms: 'Cadangkan nama', en: 'Suggest a name' },
  nickBad: { ms: 'Nama ini tak boleh digunakan. Cuba nama lain.', en: "That name can't be used. Try another one." },
  nickShort: { ms: 'Sekurang-kurangnya 3 huruf.', en: 'At least 3 letters.' },
  nickGo: { ms: 'Jom mula!', en: "Let's go!" },

  // Story
  sceneOf: { ms: 'Situasi {n} / {total}', en: 'Situation {n} / {total}' },
  tipCikgu: { ms: 'Tip cikgu', en: 'Cikgu tip' },
  continue: { ms: 'Teruskan', en: 'Continue' },
  xpGained: { ms: '+{xp} XP', en: '+{xp} XP' },

  // Semak Kerja
  semakTitle: { ms: 'Cabaran Semak Kerja!', en: 'Marking Challenge!' },
  semakBody: {
    ms: 'Murid anda sudah siap latihan. Betul (✓) atau salah (✗)? Cepat dan tepat dapat lebih XP!',
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
  semakDone: { ms: 'Siap semak!', en: 'All marked!' },
  semakCorrectMarks: { ms: '{n} daripada {total} betul', en: '{n} of {total} marked correctly' },
  semakSeeResult: { ms: 'Lihat keputusan', en: 'See my result' },

  // Result
  resultKicker: { ms: 'Anda ialah…', en: 'You are…' },
  resultXp: { ms: 'Jumlah XP', en: 'Total XP' },
  resultStrongest: { ms: 'Subjek terkuat', en: 'Strongest subject' },
  resultLevelUp: { ms: 'Subjek untuk naik level', en: 'Subjects to level up' },
  resultAllGood: { ms: 'Semua betul. Hebat!', en: 'All correct. Amazing!' },
  resultTutorPay: {
    ms: 'Tutor BSA untuk {level} dibayar RM{pay}/jam, dibayar setiap minggu.',
    en: 'BSA tutors for {level} earn RM{pay}/hour, paid weekly.',
  },
  resultRank: { ms: 'No. {rank} hari ini', en: 'No. {rank} today' },
  resultRankOf: { ms: 'daripada {n} pemain', en: 'of {n} players' },
  resultShare: { ms: 'Kongsi kad saya', en: 'Share my card' },
  resultSharing: { ms: 'Menyediakan kad…', en: 'Preparing card…' },
  resultClaim: { ms: 'Tuntut trial percuma 3 subjek', en: 'Claim free trial for 3 subjects' },
  resultJoin: { ms: 'Jom jadi cikgu BSA', en: 'Become a BSA cikgu' },
  resultPlayAgain: { ms: 'Main semula', en: 'Play again' },
  shareText: {
    ms: 'Saya {name} dengan {xp} XP dalam Cikgu Sehari! Main di booth Bright Scholar Academy, {event}.',
    en: "I'm {name} with {xp} XP in Cikgu Sehari! Play at the Bright Scholar Academy booth, {event}.",
  },

  // Sign-up
  signupTitleLearner: { ms: 'Tuntut trial percuma anda', en: 'Claim your free trial' },
  signupBodyLearner: {
    ms: 'Kelas 1-ke-1 online, 1 jam setiap subjek. Kami akan WhatsApp untuk tetapkan masa.',
    en: "1-to-1 online classes, 1 hour per subject. We'll WhatsApp you to set a time.",
  },
  signupTitleTutor: { ms: 'Mohon jadi tutor BSA', en: 'Apply to be a BSA tutor' },
  signupBodyTutor: {
    ms: 'Kongsi sedikit maklumat dan pasukan BSA akan menghubungi anda di WhatsApp.',
    en: 'Share a few details and the BSA team will contact you on WhatsApp.',
  },
  fName: { ms: 'Nama penuh', en: 'Full name' },
  fNameChild: { ms: 'Nama anak', en: "Child's name" },
  fParentName: { ms: 'Nama ibu bapa / penjaga', en: "Parent / guardian's name" },
  fWhatsapp: { ms: 'No. WhatsApp', en: 'WhatsApp number' },
  fParentWhatsapp: { ms: 'No. WhatsApp ibu bapa / penjaga', en: "Parent / guardian's WhatsApp" },
  fParentWhatsappHint: {
    ms: 'Untuk pelajar bawah 18 tahun, kami hubungi ibu bapa atau penjaga.',
    en: 'For students under 18, we contact a parent or guardian.',
  },
  fUnder18: { ms: 'Saya berumur bawah 18 tahun', en: "I'm under 18" },
  fLevel: { ms: 'Tahap', en: 'Level' },
  fChildLevel: { ms: 'Tahap anak', en: "Child's level" },
  fSchool: { ms: 'Sekolah', en: 'School' },
  fArea: { ms: 'Kawasan (bandar / negeri)', en: 'Area (town / state)' },
  fTrialSubjects: { ms: 'Pilih 3 subjek trial', en: 'Pick 3 trial subjects' },
  fTrialSubjectsHint: { ms: 'Kami dah pilihkan subjek untuk naik level. Boleh tukar.', en: "We've picked your level-up subjects. Feel free to change them." },
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
    ms: 'Hantar saya tawaran dan berita BSA yang lain (pilihan)',
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
  offerTitle: { ms: 'Tahniah! Trial anda sedia', en: 'Congrats! Your trial is ready' },
  offerExisting: {
    ms: 'Nombor ini sudah didaftarkan untuk acara ini, jadi kami guna rujukan yang sama.',
    en: 'This number is already registered for this event, so we kept the same reference.',
  },
  offerCodeLabel: { ms: 'Kod promosi', en: 'Promo code' },
  offerWhat: { ms: 'Trial percuma 3 subjek · kelas online 1-ke-1', en: 'Free trial for 3 subjects · 1-to-1 online classes' },
  offerValid: { ms: 'Sah sehingga {date}', en: 'Valid until {date}' },
  offerRef: { ms: 'No. rujukan', en: 'Reference no.' },
  offerCopy: { ms: 'Salin kod', en: 'Copy code' },
  offerCopied: { ms: 'Disalin!', en: 'Copied!' },
  offerClaim: { ms: 'Tuntut di WhatsApp', en: 'Claim on WhatsApp' },
  offerBooth: { ms: 'Tunjukkan skrin ini kepada staf di booth BSA.', en: 'Show this screen to the staff at the BSA booth.' },
  offerTutorTitle: { ms: 'Terima kasih, bakal cikgu!', en: 'Thank you, future cikgu!' },
  offerTutorBody: {
    ms: 'Pasukan BSA akan WhatsApp anda. Untuk lebih cepat, lengkapkan pendaftaran tutor di laman web BSA.',
    en: 'The BSA team will WhatsApp you. To speed things up, complete the tutor registration on the BSA website.',
  },
  offerTutorRegister: { ms: 'Daftar di laman web', en: 'Register on the website' },
  offerTutorWhatsapp: { ms: 'WhatsApp BSA', en: 'WhatsApp BSA' },
  offerTutorPerks: {
    ms: 'RM25–40/jam · bayaran mingguan · masa fleksibel · online atau di rumah murid',
    en: "RM25–40/hour · paid weekly · flexible hours · online or at the pupil's home",
  },
  waLearner: {
    ms: 'Hi BSA! Saya nak tuntut trial percuma 3 subjek dengan kod {code}.\nNama: {name}\nTahap: {level}\nSubjek: {subjects}\nRujukan: {ref}',
    en: "Hi BSA! I'd like to claim the free 3-subject trial with code {code}.\nName: {name}\nLevel: {level}\nSubjects: {subjects}\nReference: {ref}",
  },
  waTutor: {
    ms: 'Hi BSA! Saya {name}, berminat jadi tutor BSA ({subjects}, {level}). Rujukan: {ref}',
    en: "Hi BSA! I'm {name} and I'd like to become a BSA tutor ({subjects}, {level}). Reference: {ref}",
  },
} satisfies Record<string, Txt>
