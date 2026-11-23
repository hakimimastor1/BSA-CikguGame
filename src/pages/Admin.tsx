import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  BarChart3,
  Check,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  ListChecks,
  LogOut,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
} from 'lucide-react'
import { eventSlug, supabase } from '../lib/api'
import { GAME_NAME, PERSONALITY_INFO } from '../content/personalities'
import { EVENT, NEXT_YEAR } from '../content/event'
import { BSA_SUBJECTS, NEXT_LEVELS, SCHOOL_LEVELS, STREAMS, levelHasStream, streamById } from '../content/subjects'
import { waLink } from '../game/whatsapp'
import type { Game, Stream, Trait } from '../types'

type StaffRole = 'admin' | 'booth'
type Me = { email: string; role: StaffRole; name: string | null }

interface SignupRow {
  id: string
  ref: string
  role: 'pelajar' | 'ibubapa' | 'cikgu'
  name: string
  whatsapp: string
  parent_name: string | null
  under18: boolean | null
  child_name: string | null
  level: string | null
  /** Learner's class next year (the trial is for that year). */
  level_next?: string | null
  /** Stream for next year's class (Tingkatan 4–5 only). */
  stream?: Stream | null
  school: string | null
  area: string | null
  trial_subjects: string[]
  tutor_status: 'upsi' | 'grad' | null
  semester: string | null
  cgpa: string | null
  qualification: string | null
  course: string | null
  teach_subjects: string[]
  availability: string[]
  marketing: boolean
  nickname: string | null
  personality: Trait | null
  total_xp: number | null
  subjects?: { subject: string; right: number; total: number }[] | null
  /** Game played before signing up; null when they signed up without playing. */
  game?: Game | null
  status: string
  notes: string | null
  created_at: string
  /** Last admin correction of the details, and by whom. */
  edited_at?: string | null
  edited_by?: string | null
}

interface BoardRow {
  nickname: string
  xp: number
  personality: Trait
  hidden: boolean
  suspicious: boolean
  role: string
  game?: Game
}

interface Stats {
  days: { day: string; plays: number; signups: number }[]
  byRole: Record<string, { plays: number; signups: number }>
  byGame?: Partial<Record<Game, number>>
}

const ROLE_LABEL: Record<SignupRow['role'], string> = { pelajar: 'Pelajar sekolah', ibubapa: 'Ibu bapa / keluarga', cikgu: 'Bakal tutor (UPSI)' }
const LEARNER_STATUS: [string, string][] = [
  ['new', 'Belum dihubungi'],
  ['contacted', 'Dihubungi'],
  ['trial_booked', 'Trial ditempah'],
  ['enrolled', 'Mendaftar'],
  ['not_interested', 'Tidak berminat'],
]
const TUTOR_STATUS: [string, string][] = [
  ['new', 'Belum dihubungi'],
  ['contacted', 'Dihubungi'],
  ['interviewed', 'Ditemu duga'],
  ['hired', 'Diambil'],
  ['not_suitable', 'Tidak sesuai'],
]
const ALL_STATUS = new Map([...LEARNER_STATUS, ...TUTOR_STATUS])
const AVAIL_LABEL: Record<string, string> = { weekday: 'Hari biasa (malam)', weekend: 'Hujung minggu', flexible: 'Fleksibel' }

const myDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
const myTime = (iso: string) =>
  new Date(iso).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const prettyPhone = (n: string) => `+${n.slice(0, 2)} ${n.slice(2, 4)}-${n.slice(4, 7)} ${n.slice(7)}`

const SUBJECT_BM: Record<string, string> = { bm: 'BM', bi: 'BI', math: 'Matematik', sci: 'Sains', phy: 'Fizik', chem: 'Kimia', bio: 'Biologi' }
const GAMES: Game[] = ['cikgu', 'pelajar']
const gameName = (g: Game | null | undefined) => (g ? GAME_NAME[g].ms : '')
/** What the question round is called in each game. */
const roundName = (g: Game | null | undefined) => (g === 'pelajar' ? 'Kuiz Kilat' : 'Semak Kerja')

function followUpMessage(s: SignupRow): string {
  if (s.role === 'cikgu') {
    return `Hai ${s.name}! Ini Bright Scholar Academy. Terima kasih kerana berminat menjadi tutor BSA di ${EVENT.name}. Boleh kami tetapkan sesi temu duga ringkas dan demo mengajar? Bila anda free? Rujukan: ${s.ref}`
  }
  const greet = s.parent_name || s.name
  const learner = s.child_name || s.name
  const results = (s.subjects ?? [])
    .map((x) => `${SUBJECT_BM[x.subject] ?? x.subject} ${x.right}/${x.total}`)
    .join(', ')
  const report = results ? ` Keputusan ${roundName(s.game)} ${learner}: ${results}.` : ''
  const played = s.game ? ` bermain ${gameName(s.game)}` : ' singgah'
  return `Hai ${greet}! Ini Bright Scholar Academy. Terima kasih kerana${played} di booth kami di ${EVENT.name}.${report} Jom tetapkan masa untuk trial percuma 3 subjek (${s.trial_subjects.join(', ')}) untuk ${learner}${s.level_next ? ` (${s.level_next} pada ${NEXT_YEAR}${s.stream ? `, aliran ${streamById(s.stream)?.label.ms}` : ''})` : ''}. Bila masa yang sesuai? Rujukan: ${s.ref}`
}

function toCsv(rows: SignupRow[]): string {
  const cols: [string, (r: SignupRow) => unknown][] = [
    ['Rujukan', (r) => r.ref],
    ['Masa', (r) => myTime(r.created_at)],
    ['Peranan', (r) => ROLE_LABEL[r.role]],
    ['Nama', (r) => r.name],
    ['WhatsApp', (r) => '+' + r.whatsapp],
    ['Nama ibu bapa', (r) => r.parent_name],
    ['Bawah 18', (r) => (r.under18 ? 'Ya' : '')],
    ['Nama anak', (r) => r.child_name],
    [`Tahap ${NEXT_YEAR - 1}`, (r) => r.level],
    [`Kelas ${NEXT_YEAR}`, (r) => r.level_next],
    ['Aliran', (r) => streamById(r.stream)?.label.ms],
    ['Sekolah', (r) => r.school],
    ['Kawasan', (r) => r.area],
    ['Subjek trial', (r) => r.trial_subjects.join('; ')],
    ['Status tutor', (r) => (r.tutor_status === 'upsi' ? 'Pelajar UPSI' : r.tutor_status === 'grad' ? 'Graduan' : '')],
    ['Semester', (r) => r.semester],
    ['CGPA', (r) => r.cgpa],
    ['Kelayakan', (r) => r.qualification],
    ['Program', (r) => r.course],
    ['Subjek diajar', (r) => r.teach_subjects.join('; ')],
    ['Masa lapang', (r) => r.availability.map((a) => AVAIL_LABEL[a] ?? a).join('; ')],
    ['Setuju pemasaran', (r) => (r.marketing ? 'Ya' : 'Tidak')],
    ['Permainan', (r) => gameName(r.game)],
    ['Nama gelaran', (r) => r.nickname],
    ['Personaliti', (r) => (r.personality ? PERSONALITY_INFO[r.personality].name : '')],
    ['XP', (r) => r.total_xp],
    ['Status', (r) => ALL_STATUS.get(r.status) ?? r.status],
    ['Nota', (r) => r.notes],
  ]
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cols.map((c) => c[0]).join(','), ...rows.map((r) => cols.map((c) => esc(c[1](r))).join(','))].join('\r\n')
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<Me | null | 'checking'>('checking')

  useEffect(() => {
    document.title = 'BSA Booth · Admin'
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      setMe(null)
      return
    }
    setMe('checking')
    supabase.rpc('staff_me').then(({ data }) => setMe((data as Me | null) ?? null))
  }, [session])

  if (!supabase) {
    return (
      <Shell>
        <p className="clay-card p-5">Pangkalan data belum disambungkan untuk laman ini.</p>
      </Shell>
    )
  }
  if (!session) return <Login />
  if (me === 'checking') return <Shell>Memuatkan…</Shell>
  if (!me) {
    return (
      <Shell>
        <div className="clay-card flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 font-bold">
            <ShieldAlert size={20} /> Akaun {session.user.email} bukan akaun staf booth BSA.
          </p>
          <button type="button" className="clay-btn bg-white" onClick={() => supabase!.auth.signOut()}>
            <LogOut size={18} /> Log keluar
          </button>
        </div>
      </Shell>
    )
  }
  return <Dashboard me={me} />
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-10">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <img src="/bsa-mark.png" alt="" className="h-10 w-auto" />
          <div>
            <p className="font-display text-xl font-extrabold leading-none">BSA Booth · Admin</p>
            <p className="text-sm text-muted">{EVENT.name}</p>
          </div>
        </div>
        {right}
      </header>
      {children}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setErr('E-mel atau kata laluan salah, atau talian lemah. Cuba lagi.')
    setBusy(false)
  }
  return (
    <Shell>
      <form onSubmit={submit} className="clay-card mx-auto mt-8 flex max-w-sm flex-col gap-4 p-6">
        <h1 className="font-display text-2xl font-extrabold">Log masuk staf</h1>
        <label className="flex flex-col gap-1.5 font-bold">
          E-mel
          <input className="field font-normal" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5 font-bold">
          Kata laluan
          <input
            className="field font-normal"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {err && (
          <p className="text-sm font-bold text-wrong" role="alert">
            {err}
          </p>
        )}
        <button type="submit" className="clay-btn bg-yellow" disabled={busy}>
          {busy ? 'Sedang log masuk…' : 'Log masuk'}
        </button>
      </form>
    </Shell>
  )
}

type Tab = 'signups' | 'board' | 'stats' | 'account'

function Dashboard({ me }: { me: Me }) {
  const [tab, setTab] = useState<Tab>('signups')
  const tabs: { id: Tab; label: string; icon: typeof ListChecks }[] = [
    { id: 'signups', label: 'Pendaftaran', icon: ListChecks },
    { id: 'board', label: 'Papan skor', icon: Trophy },
    { id: 'stats', label: 'Statistik', icon: BarChart3 },
    { id: 'account', label: 'Akaun', icon: KeyRound },
  ]
  return (
    <Shell
      right={
        <button type="button" className="clay-btn min-h-11 bg-white px-3 text-base" onClick={() => supabase!.auth.signOut()} aria-label="Log keluar">
          <LogOut size={18} />
        </button>
      }
    >
      <nav className="mb-4 grid grid-cols-4 gap-2" aria-label="Bahagian">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-[3px] border-navy text-sm font-bold ${tab === id ? 'bg-yellow' : 'bg-white'}`}
          >
            <Icon size={20} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </nav>
      {tab === 'signups' && <Signups me={me} />}
      {tab === 'board' && <BoardTab isAdmin={me.role === 'admin'} />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'account' && <Account me={me} />}
    </Shell>
  )
}

function Signups({ me }: { me: Me }) {
  const [rows, setRows] = useState<SignupRow[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [day, setDay] = useState('all')

  const load = useCallback(async () => {
    const { data, error } = await supabase!.rpc('staff_signups', { p_event: eventSlug })
    if (error) setErr('Gagal memuatkan. Semak talian dan cuba lagi.')
    else {
      setErr('')
      setRows(data as SignupRow[])
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(load, 30000)
    return () => window.clearInterval(id)
  }, [load])

  const days = useMemo(() => [...new Set((rows ?? []).map((r) => myDay(r.created_at)))].sort().reverse(), [rows])
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) =>
        (role === 'all' || r.role === role) &&
        (status === 'all' || r.status === status) &&
        (day === 'all' || myDay(r.created_at) === day) &&
        (!needle || [r.name, r.ref, r.whatsapp, r.parent_name, r.child_name, r.school].some((v) => v?.toLowerCase().includes(needle))),
    )
  }, [rows, q, role, status, day])

  const patch = (id: string, p: Partial<SignupRow>) => setRows((cur) => cur?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null)

  return (
    <div className="flex flex-col gap-3">
      <div className="clay-card flex flex-col gap-3 p-4">
        <label className="relative">
          <span className="sr-only">Cari</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field pl-10" placeholder="Cari nama, rujukan, nombor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select className="field text-sm" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Peranan">
            <option value="all">Semua peranan</option>
            <option value="pelajar">Pelajar sekolah</option>
            <option value="ibubapa">Ibu bapa / keluarga</option>
            <option value="cikgu">Bakal tutor (UPSI)</option>
          </select>
          <select className="field text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="all">Semua status</option>
            {[...ALL_STATUS].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select className="field text-sm" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Hari">
            <option value="all">Semua hari</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {new Date(d + 'T00:00:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">
            {rows ? `${shown.length} daripada ${rows.length} pendaftaran` : 'Memuatkan…'}
          </p>
          <div className="flex gap-2">
            <button type="button" className="clay-btn min-h-11 bg-white px-3 text-base" onClick={load} aria-label="Muat semula">
              <RefreshCw size={18} />
            </button>
            {me.role === 'admin' && (
              <button
                type="button"
                className="clay-btn min-h-11 bg-white px-3 text-base"
                disabled={!shown.length}
                onClick={() => download(`cikgu-sehari-${eventSlug}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(shown))}
              >
                <Download size={18} /> CSV
              </button>
            )}
          </div>
        </div>
        {err && <p className="font-bold text-wrong">{err}</p>}
      </div>

      {shown.map((r) => (
        <SignupCard key={r.id} r={r} isAdmin={me.role === 'admin'} onPatch={(p) => patch(r.id, p)} />
      ))}
    </div>
  )
}

const ALL_SUBJECTS = [...new Set(Object.values(BSA_SUBJECTS).flat())]
const levelByLabel = (label: string) => SCHOOL_LEVELS.find((l) => l.label.ms === label)
/** 60123456789 -> 0123456789, the way people type it. */
const localPhone = (n: string) => (n.startsWith('60') ? '0' + n.slice(2) : n)

function editError(m: string): string {
  if (/bad phone/.test(m)) return 'Nombor WhatsApp tidak sah. Contoh: 012-345 6789.'
  if (/pick 3/.test(m)) return 'Pilih tepat 3 subjek trial.'
  if (/missing subjects/.test(m)) return 'Pilih sekurang-kurangnya 1 subjek yang boleh diajar.'
  if (/name required/.test(m)) return 'Nama wajib diisi.'
  if (/admin only/.test(m)) return 'Hanya admin boleh edit pendaftaran.'
  return `Tidak berjaya: ${m}`
}

function ChipPick({ options, value, max, onChange }: { options: string[]; value: string[]; max?: number; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : max && value.length >= max ? value : [...value, o])}
            className={`min-h-10 rounded-full border-2 border-navy px-3 text-sm font-bold ${on ? 'bg-yellow' : 'bg-white'}`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** Admin only: correct the details of a sign-up. Same checks as the sign-up form, on the server. */
function EditSignup({ r, onSaved, onCancel }: { r: SignupRow; onSaved: (row: Partial<SignupRow>) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    role: r.role,
    name: r.name,
    whatsapp: localPhone(r.whatsapp),
    parentName: r.parent_name ?? '',
    under18: !!r.under18,
    childName: r.child_name ?? '',
    level: r.level ?? '',
    levelNext: r.level_next ?? '',
    stream: (r.stream ?? '') as Stream | '',
    school: r.school ?? '',
    area: r.area ?? '',
    trialSubjects: r.trial_subjects,
    tutorStatus: r.tutor_status ?? 'upsi',
    semester: r.semester ?? '',
    cgpa: r.cgpa ?? '',
    qualification: r.qualification ?? '',
    course: r.course ?? '',
    teachSubjects: r.teach_subjects,
    availability: r.availability,
    marketing: r.marketing,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((c) => ({ ...c, [k]: v }))
  // Fields follow the role chosen here, so a wrong role can be corrected too.
  const tutor = f.role === 'cikgu'
  const withCurrent = (list: string[], current: string) => (current && !list.includes(current) ? [current, ...list] : list)
  const trialBand = levelByLabel(f.levelNext)?.band
  // Tingkatan 4–5 next year: the stream can be set or corrected; other classes have none.
  const showStream = !tutor && levelHasStream(levelByLabel(f.levelNext)?.id ?? '')
  const trialList = [...new Set([...(trialBand ? BSA_SUBJECTS[trialBand] : ALL_SUBJECTS), ...f.trialSubjects])]

  const save = async () => {
    setBusy(true)
    setError(null)
    const { data, error: e } = await supabase!.rpc('staff_edit_signup', { p_id: r.id, p: { ...f, stream: showStream ? f.stream : null } })
    setBusy(false)
    if (e) setError(editError(e.message))
    else onSaved(data as Partial<SignupRow>)
  }

  const text = (label: string, k: 'name' | 'whatsapp' | 'parentName' | 'childName' | 'school' | 'area' | 'semester' | 'cgpa' | 'qualification' | 'course', extra?: { inputMode?: 'tel' | 'numeric' | 'decimal' }) => (
    <label className="flex flex-col gap-1 text-sm font-bold">
      {label}
      <input className="field font-normal" value={f[k] as string} inputMode={extra?.inputMode} onChange={(e) => set(k, e.target.value)} />
    </label>
  )
  const select = (label: string, k: 'level' | 'levelNext', ids: string[]) => {
    const labels = withCurrent(ids.map((id) => SCHOOL_LEVELS.find((l) => l.id === id)!.label.ms), f[k])
    return (
      <label className="flex flex-col gap-1 text-sm font-bold">
        {label}
        <select className="field font-normal" value={f[k]} onChange={(e) => set(k, e.target.value)}>
          {!f[k] && <option value="">–</option>}
          {labels.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[3px] border-navy bg-yellow-soft p-3">
      <p className="font-display text-lg font-extrabold">Edit pendaftaran {r.ref}</p>
      <label className="flex flex-col gap-1 text-sm font-bold">
        Peranan
        <select className="field font-normal" value={f.role} onChange={(e) => set('role', e.target.value as SignupRow['role'])}>
          {(['pelajar', 'ibubapa', 'cikgu'] as const).map((x) => (
            <option key={x} value={x}>
              {ROLE_LABEL[x]}
            </option>
          ))}
        </select>
      </label>
      {text(f.role === 'ibubapa' ? 'Nama ibu bapa' : 'Nama penuh', 'name')}
      {text(f.role === 'pelajar' && f.under18 ? 'No. WhatsApp ibu bapa / penjaga' : 'No. WhatsApp', 'whatsapp', { inputMode: 'tel' })}
      {f.role === 'pelajar' && (
        <>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" className="h-5 w-5 accent-[#023E86]" checked={f.under18} onChange={(e) => set('under18', e.target.checked)} />
            Bawah 18 tahun
          </label>
          {f.under18 && text('Nama ibu bapa / penjaga', 'parentName')}
        </>
      )}
      {f.role === 'ibubapa' && text('Nama anak / adik', 'childName')}
      {!tutor && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {select(`Tahap ${NEXT_YEAR - 1}`, 'level', SCHOOL_LEVELS.map((l) => l.id))}
            {select(`Kelas ${NEXT_YEAR}`, 'levelNext', NEXT_LEVELS)}
          </div>
          {showStream && (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Aliran {NEXT_YEAR}
              <select className="field font-normal" value={f.stream} onChange={(e) => set('stream', e.target.value as Stream | '')}>
                {!f.stream && <option value="">–</option>}
                {STREAMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label.ms}
                  </option>
                ))}
              </select>
            </label>
          )}
          {text('Sekolah', 'school')}
        </>
      )}
      {tutor && (
        <>
          <div className="flex flex-col gap-1 text-sm font-bold">
            Status
            <ChipPick options={['Pelajar UPSI', 'Graduan / bekerja']} value={[f.tutorStatus === 'grad' ? 'Graduan / bekerja' : 'Pelajar UPSI']} onChange={(v) => set('tutorStatus', v.includes('Graduan / bekerja') && f.tutorStatus !== 'grad' ? 'grad' : 'upsi')} />
          </div>
          {f.tutorStatus === 'upsi' ? (
            <div className="grid grid-cols-2 gap-2">
              {text('Semester', 'semester', { inputMode: 'numeric' })}
              {text('CGPA', 'cgpa', { inputMode: 'decimal' })}
            </div>
          ) : (
            text('Kelayakan tertinggi', 'qualification')
          )}
          {text('Program / bidang', 'course')}
          <div className="flex flex-col gap-1 text-sm font-bold">
            Subjek yang boleh diajar
            <ChipPick options={[...new Set([...ALL_SUBJECTS, ...f.teachSubjects])]} value={f.teachSubjects} onChange={(v) => set('teachSubjects', v)} />
          </div>
          <div className="flex flex-col gap-1 text-sm font-bold">
            Masa lapang
            <ChipPick
              options={Object.values(AVAIL_LABEL)}
              value={f.availability.map((a) => AVAIL_LABEL[a] ?? a)}
              onChange={(v) => set('availability', Object.keys(AVAIL_LABEL).filter((k) => v.includes(AVAIL_LABEL[k])))}
            />
          </div>
        </>
      )}
      {text('Kawasan', 'area')}
      {!tutor && (
        <div className="flex flex-col gap-1 text-sm font-bold">
          Subjek trial ({f.trialSubjects.length}/3)
          <ChipPick options={trialList} value={f.trialSubjects} max={3} onChange={(v) => set('trialSubjects', v)} />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="h-5 w-5 accent-[#023E86]" checked={f.marketing} onChange={(e) => set('marketing', e.target.checked)} />
        Setuju terima tawaran lain daripada BSA
      </label>
      {error && (
        <p className="rounded-xl bg-wrong-soft p-2 text-sm font-bold text-wrong" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="clay-btn min-h-11 bg-white text-base" onClick={onCancel} disabled={busy}>
          Batal
        </button>
        <button type="button" className="clay-btn min-h-11 bg-yellow text-base" onClick={save} disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

function SignupCard({ r, isAdmin, onPatch }: { r: SignupRow; isAdmin: boolean; onPatch: (p: Partial<SignupRow>) => void }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(r.notes ?? '')
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const statuses = r.role === 'cikgu' ? TUTOR_STATUS : LEARNER_STATUS

  const save = async (p: { status?: string; notes?: string }) => {
    setSaved('saving')
    const { error } = await supabase!.rpc('staff_update_signup', { p_id: r.id, p_status: p.status ?? null, p_notes: p.notes ?? null })
    if (error) setSaved('error')
    else {
      setSaved('saved')
      onPatch(p)
      setTimeout(() => setSaved('idle'), 1500)
    }
  }

  const details: string[] = []
  if (r.role === 'cikgu') {
    if (r.tutor_status === 'upsi') details.push(`Pelajar UPSI · Sem ${r.semester ?? '?'} · CGPA ${r.cgpa ?? '?'}`)
    if (r.tutor_status === 'grad') details.push(`Graduan · ${r.qualification ?? ''}`)
    if (r.course) details.push(r.course)
    if (r.teach_subjects.length) details.push(`Boleh ajar: ${r.teach_subjects.join(', ')}`)
    if (r.availability.length) details.push(`Masa lapang: ${r.availability.map((a) => AVAIL_LABEL[a] ?? a).join(', ')}`)
  } else {
    if (r.child_name) details.push(`Anak/adik: ${r.child_name}`)
    if (r.level) details.push((r.level_next ? `${r.level} → ${NEXT_YEAR}: ${r.level_next}` : r.level) + (r.stream ? ` · ${streamById(r.stream)?.label.ms}` : ''))
    if (r.school) details.push(r.school)
    if (r.trial_subjects.length) details.push(`Trial: ${r.trial_subjects.join(', ')}`)
    if (r.subjects?.length) details.push(`${roundName(r.game)}: ${r.subjects.map((x) => `${SUBJECT_BM[x.subject] ?? x.subject} ${x.right}/${x.total}`).join(', ')}`)
  }
  if (r.area) details.push(r.area)

  return (
    <article className="clay-card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-extrabold leading-tight">{r.name}</h3>
          <p className="text-sm text-muted">
            {r.under18 ? `Bawah 18 · ibu bapa: ${r.parent_name || '–'} · ` : ''}
            {prettyPhone(r.whatsapp)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-full border-2 border-navy bg-sky px-2.5 py-0.5 text-xs font-bold">{ROLE_LABEL[r.role]}</span>
          <p className="mt-1 font-display font-extrabold">{r.ref}</p>
        </div>
      </div>
      {editing ? (
        <EditSignup
          r={r}
          onCancel={() => setEditing(false)}
          onSaved={(row) => {
            onPatch(row)
            setEditing(false)
          }}
        />
      ) : (
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-[0.95rem] leading-snug">{details.join(' · ')}</p>
          {isAdmin && (
            <button type="button" className="clay-btn min-h-11 shrink-0 bg-white px-3 text-sm" onClick={() => setEditing(true)} aria-label={`Edit ${r.ref}`}>
              <Pencil size={16} /> Edit
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-muted">
        {myTime(r.created_at)}
        {r.personality ? ` · ${gameName(r.game) || 'Main'}: ${r.nickname} · ${PERSONALITY_INFO[r.personality].name} · ${r.total_xp} XP` : ''}
        {r.marketing ? ' · setuju terima tawaran' : ''}
        {r.edited_at ? ` · diedit ${myTime(r.edited_at)}${r.edited_by ? ` oleh ${r.edited_by}` : ''}` : ''}
      </p>
      <p className="-mb-2 text-sm font-bold">Status susulan</p>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          className="field"
          value={r.status}
          aria-label="Status susulan"
          onChange={(e) => {
            onPatch({ status: e.target.value })
            void save({ status: e.target.value })
          }}
        >
          {statuses.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <a className="clay-btn min-h-12 bg-yellow px-4 text-base" href={waLink(r.whatsapp, followUpMessage(r))} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> WhatsApp
        </a>
      </div>
      <label className="flex flex-col gap-1 text-sm font-bold">
        Nota
        <textarea
          className="field min-h-16 font-normal"
          value={notes}
          maxLength={1000}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (r.notes ?? '')) void save({ notes })
          }}
        />
      </label>
      <p className="h-4 text-xs font-bold text-muted" aria-live="polite">
        {saved === 'saving' ? 'Menyimpan…' : saved === 'saved' ? 'Disimpan' : saved === 'error' ? 'Gagal simpan, cuba lagi' : ''}
      </p>
    </article>
  )
}

function BoardTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null)
  const load = useCallback(async () => {
    const { data } = await supabase!.rpc('staff_board', { p_event: eventSlug, p_day: null })
    setRows((data as BoardRow[]) ?? [])
  }, [])
  useEffect(() => {
    void load()
    const id = window.setInterval(load, 10000)
    return () => window.clearInterval(id)
  }, [load])

  const toggle = async (r: BoardRow) => {
    await supabase!.rpc('staff_set_hidden', { p_event: eventSlug, p_nickname: r.nickname, p_hidden: !r.hidden })
    void load()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="clay-card bg-yellow-soft p-4 text-sm font-bold">
        Papan skor, sama seperti di projektor. Sembunyikan nama yang tidak sesuai. Main yang terlalu pantas (mungkin
        ditipu) ditanda dan tidak dipaparkan.
      </p>
      <a className="clay-btn bg-white" href={`/tv?e=${eventSlug}`} target="_blank" rel="noreferrer">
        <Trophy size={18} /> Buka skrin projektor
      </a>
      {rows?.length === 0 && <p className="text-center text-muted">Belum ada pemain di papan skor.</p>}
      {rows != null &&
        rows.length > 0 &&
        GAMES.map((g) => {
          const list = rows.filter((r) => (r.game ?? 'cikgu') === g)
          return (
            <section key={g} className="flex flex-col gap-2">
              <h3 className="mt-2 font-display text-xl font-extrabold">
                {g === 'cikgu' ? 'Top Cikgu Sehari' : 'Top Pelajar Bijak'}{' '}
                <span className="text-sm font-bold text-muted">· {list.length} nama di papan</span>
              </h3>
              {list.length === 0 && <p className="text-sm text-muted">Belum ada pemain {gameName(g)} di papan.</p>}
              <ol className="flex flex-col gap-2">
                {list.map((r, i) => (
                  <li key={`${g}:${r.nickname}`} className={`clay-card flex items-center gap-3 p-3 ${r.hidden ? 'opacity-55' : ''}`}>
                    <span className="w-7 text-center font-display text-lg font-extrabold">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{r.nickname}</p>
                      <p className="text-xs text-muted">
                        {PERSONALITY_INFO[r.personality]?.name} · {ROLE_LABEL[r.role as SignupRow['role']] ?? r.role}
                        {r.suspicious ? ' · terlalu pantas' : ''}
                      </p>
                    </div>
                    <span className="font-display text-xl font-extrabold tabular-nums">{r.xp}</span>
                    <button
                      type="button"
                      className="clay-btn min-h-11 bg-white px-3 text-sm"
                      onClick={() => toggle(r)}
                      aria-label={r.hidden ? `Papar ${r.nickname}` : `Sembunyi ${r.nickname}`}
                    >
                      {r.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      {isAdmin && <AdminTools onChange={load} />}
    </div>
  )
}

interface EventInfo {
  name: string
  startsOn: string
  today: string
  boardResetAt: string | null
  boardMode: 'manual' | 'daily'
  boardSize: number
  beforeStart: boolean
  plays: number
  signups: number
}

const prettyDay = (d: string) =>
  new Date(d + 'T00:00:00+08:00').toLocaleDateString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short' })

/** Admin only: start the projector boards again, and (before the event) clear the team's test data. */
function AdminTools({ onChange }: { onChange: () => void }) {
  const [info, setInfo] = useState<EventInfo | null>(null)
  const [ask, setAsk] = useState<'reset' | 'clear' | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [mode, setMode] = useState<'manual' | 'daily'>('manual')
  const [size, setSize] = useState(5)
  const loadInfo = useCallback(async () => {
    const { data } = await supabase!.rpc('staff_event', { p_event: eventSlug })
    if (data) {
      const d = data as EventInfo
      setInfo(d)
      setMode(d.boardMode ?? 'manual')
      setSize(d.boardSize ?? 5)
    }
  }, [])
  const changed = info != null && (mode !== info.boardMode || size !== info.boardSize)

  const saveSettings = async () => {
    setBusy(true)
    setMsg(null)
    const { error } = await supabase!.rpc('staff_set_board_settings', { p_event: eventSlug, p_mode: mode, p_size: size })
    setBusy(false)
    setMsg(error ? `Tidak berjaya: ${error.message}` : 'Tetapan disimpan. Projektor dikemas kini dalam beberapa saat.')
    await loadInfo()
    onChange()
  }
  useEffect(() => {
    void loadInfo()
  }, [loadInfo])

  const run = async (what: 'reset' | 'clear') => {
    setBusy(true)
    setMsg(null)
    const { data, error } = await supabase!.rpc(what === 'reset' ? 'staff_reset_board' : 'staff_clear_test_data', { p_event: eventSlug })
    setBusy(false)
    setAsk(null)
    if (error) {
      setMsg(/started/.test(error.message) ? 'Event sudah bermula, jadi data tidak boleh dikosongkan lagi.' : `Tidak berjaya: ${error.message}`)
    } else if (what === 'reset') {
      setMsg('Papan skor sudah direset. Projektor akan kosong dalam beberapa saat.')
    } else {
      const r = data as { plays: number; signups: number }
      setMsg(`Selesai: ${r.plays} main dan ${r.signups} pendaftaran ujian sudah dikeluarkan. Event bermula bersih.`)
    }
    await loadInfo()
    onChange()
  }

  const confirmRow = (what: 'reset' | 'clear', text: string, label: string) => (
    <div className="flex flex-col gap-2 rounded-2xl border-[3px] border-wrong bg-wrong-soft p-3" role="alert">
      <p className="text-sm font-bold">{text}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="clay-btn min-h-11 bg-white text-base" onClick={() => setAsk(null)} disabled={busy}>
          Batal
        </button>
        <button type="button" className="clay-btn min-h-11 bg-yellow text-base" onClick={() => run(what)} disabled={busy}>
          {busy ? 'Sedang proses…' : label}
        </button>
      </div>
    </div>
  )

  return (
    <section className="clay-card mt-4 flex flex-col gap-3 p-4" aria-labelledby="admin-tools">
      <h3 id="admin-tools" className="font-display text-xl font-extrabold">
        Alat admin
      </h3>

      <fieldset className="flex flex-col gap-2" disabled={busy || !info}>
        <legend className="mb-1 font-bold">Tetapan papan skor</legend>
        <p className="text-sm font-bold">Bila papan skor dikosongkan?</p>
        {(
          [
            ['manual', 'Manual', 'Papan kekal sehingga admin tekan Reset. Sesuai untuk kumpul pemenang sepanjang event atau ikut sesi.'],
            ['daily', 'Automatik setiap hari', 'Papan kosong sendiri setiap hari pada tengah malam. Admin masih boleh tekan Reset bila-bila masa.'],
          ] as const
        ).map(([id, label, hint]) => (
          <label
            key={id}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[3px] p-3 ${mode === id ? 'border-navy bg-yellow-soft' : 'border-sky bg-white'}`}
          >
            <input type="radio" name="board-mode" className="mt-1 h-5 w-5 accent-[#023E86]" checked={mode === id} onChange={() => setMode(id)} />
            <span>
              <span className="block font-bold">{label}</span>
              <span className="block text-sm text-muted">{hint}</span>
            </span>
          </label>
        ))}
        <p className="mt-1 text-sm font-bold">Nama di projektor (setiap papan)</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Nama di projektor">
          {[3, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={size === n}
              onClick={() => setSize(n)}
              className={`min-h-11 rounded-2xl border-[3px] font-display text-lg font-extrabold ${size === n ? 'border-navy bg-yellow' : 'border-sky bg-white'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <button type="button" className="clay-btn min-h-11 bg-yellow text-base" disabled={!changed || busy} onClick={saveSettings}>
          Simpan tetapan
        </button>
      </fieldset>

      <div className="flex flex-col gap-2 border-t-[3px] border-dashed border-sky pt-3">
        <p className="font-bold">Reset papan skor</p>
        <p className="text-sm text-muted">
          Kosongkan kedua-dua papan di projektor dan mula semula dari sekarang. Keputusan pemain, pendaftaran dan statistik tidak
          dipadam.
          {info?.boardMode === 'daily' ? ' Papan juga kosong sendiri setiap tengah malam.' : ' Dalam mod Manual, papan kekal sehingga butang ini ditekan.'}
          {info?.boardResetAt ? ` Reset terakhir: ${myTime(info.boardResetAt)}.` : ''}
        </p>
        {ask === 'reset' ? (
          confirmRow('reset', 'Pasti? Semua nama di kedua-dua papan projektor akan hilang dari papan.', 'Ya, reset papan')
        ) : (
          <button type="button" className="clay-btn min-h-11 bg-white text-base" onClick={() => setAsk('reset')}>
            <RefreshCw size={18} /> Reset papan skor sekarang
          </button>
        )}
      </div>

      {info?.beforeStart && (
        <div className="flex flex-col gap-2 border-t-[3px] border-dashed border-sky pt-3">
          <p className="font-bold">Kosongkan data ujian</p>
          <p className="text-sm text-muted">
            Untuk selepas pasukan BSA selesai menguji. Semua {info.plays} main dan {info.signups} pendaftaran setakat ini dikeluarkan
            dari {info.name}, supaya admin dan statistik bermula bersih. Hanya boleh sebelum event bermula ({prettyDay(info.startsOn)}).
          </p>
          {ask === 'clear' ? (
            confirmRow('clear', `Pasti? ${info.plays} main dan ${info.signups} pendaftaran ujian akan dikeluarkan dari senarai.`, 'Ya, kosongkan')
          ) : (
            <button type="button" className="clay-btn min-h-11 bg-white text-base" onClick={() => setAsk('clear')} disabled={!info.plays && !info.signups}>
              <ShieldAlert size={18} /> Kosongkan data ujian
            </button>
          )}
        </div>
      )}

      {msg && (
        <p className="rounded-2xl bg-yellow-soft p-3 text-sm font-bold" role="status">
          {msg}
        </p>
      )}
    </section>
  )
}

function StatsTab() {
  const [s, setS] = useState<Stats | null>(null)
  useEffect(() => {
    supabase!.rpc('staff_stats', { p_event: eventSlug }).then(({ data }) => setS(data as Stats))
  }, [])
  if (!s) return <p className="text-muted">Memuatkan…</p>
  const totalPlays = s.days.reduce((a, d) => a + d.plays, 0)
  const totalSignups = s.days.reduce((a, d) => a + d.signups, 0)
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Pemain', totalPlays],
          ['Pendaftaran', totalSignups],
          ['Kadar daftar', totalPlays ? `${Math.round((totalSignups / totalPlays) * 100)}%` : '–'],
        ].map(([l, v]) => (
          <div key={l as string} className="clay-card p-3 text-center">
            <p className="font-display text-3xl font-extrabold tabular-nums">{v}</p>
            <p className="text-sm font-bold text-muted">{l}</p>
          </div>
        ))}
      </div>
      {s.byGame && (
        <div className="grid grid-cols-2 gap-2">
          {GAMES.map((g) => (
            <div key={g} className="clay-card p-3 text-center">
              <p className="font-display text-2xl font-extrabold tabular-nums">{s.byGame?.[g] ?? 0}</p>
              <p className="text-sm font-bold text-muted">main {gameName(g)}</p>
            </div>
          ))}
        </div>
      )}
      <table className="clay-card w-full overflow-hidden text-left text-sm">
        <thead className="bg-sky">
          <tr>
            <th className="p-2.5">Peranan</th>
            <th className="p-2.5 text-right">Pemain</th>
            <th className="p-2.5 text-right">Daftar</th>
          </tr>
        </thead>
        <tbody>
          {(['pelajar', 'ibubapa', 'cikgu'] as const).map((r) => (
            <tr key={r} className="border-t-2 border-sky">
              <td className="p-2.5 font-bold">{ROLE_LABEL[r]}</td>
              <td className="p-2.5 text-right tabular-nums">{s.byRole[r]?.plays ?? 0}</td>
              <td className="p-2.5 text-right tabular-nums">{s.byRole[r]?.signups ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="clay-card w-full overflow-hidden text-left text-sm">
        <thead className="bg-sky">
          <tr>
            <th className="p-2.5">Hari</th>
            <th className="p-2.5 text-right">Pemain</th>
            <th className="p-2.5 text-right">Daftar</th>
          </tr>
        </thead>
        <tbody>
          {s.days.map((d) => (
            <tr key={d.day} className="border-t-2 border-sky">
              <td className="p-2.5 font-bold">{new Date(d.day + 'T00:00:00').toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
              <td className="p-2.5 text-right tabular-nums">{d.plays}</td>
              <td className="p-2.5 text-right tabular-nums">{d.signups}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Account({ me }: { me: Me }) {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const { error } = await supabase!.auth.updateUser({ password: pw })
    setMsg(error ? 'Gagal: ' + error.message : 'Kata laluan ditukar.')
    if (!error) setPw('')
  }
  return (
    <form onSubmit={submit} className="clay-card flex flex-col gap-3 p-5">
      <p>
        Log masuk sebagai <b>{me.email}</b> ({me.role === 'admin' ? 'admin' : 'staf booth'}).
      </p>
      <label className="flex flex-col gap-1.5 font-bold">
        Kata laluan baharu (sekurang-kurangnya 8 aksara)
        <input className="field font-normal" type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
      </label>
      <button type="submit" className="clay-btn bg-yellow">
        <Check size={18} /> Tukar kata laluan
      </button>
      {msg && <p className="font-bold">{msg}</p>}
    </form>
  )
}
