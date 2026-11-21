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
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
} from 'lucide-react'
import { eventSlug, supabase } from '../lib/api'
import { GAME_NAME, PERSONALITY_INFO } from '../content/personalities'
import { EVENT } from '../content/event'
import { waLink } from '../game/whatsapp'
import type { Game, Trait } from '../types'

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
  ['new', 'Baru'],
  ['contacted', 'Dihubungi'],
  ['trial_booked', 'Trial ditempah'],
  ['enrolled', 'Mendaftar'],
  ['not_interested', 'Tidak berminat'],
]
const TUTOR_STATUS: [string, string][] = [
  ['new', 'Baru'],
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
  return `Hai ${greet}! Ini Bright Scholar Academy. Terima kasih kerana${played} di booth kami di ${EVENT.name}.${report} Jom tetapkan masa untuk trial percuma 3 subjek (${s.trial_subjects.join(', ')}) untuk ${learner}. Bila masa yang sesuai? Rujukan: ${s.ref}`
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
    ['Tahap', (r) => r.level],
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
    document.title = 'Cikgu Sehari · Admin'
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
            <ShieldAlert size={20} /> Akaun {session.user.email} bukan akaun staf Cikgu Sehari.
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
            <p className="font-display text-xl font-extrabold leading-none">Cikgu Sehari · Admin</p>
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
      {tab === 'board' && <BoardTab />}
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
        <SignupCard key={r.id} r={r} onPatch={(p) => patch(r.id, p)} />
      ))}
    </div>
  )
}

function SignupCard({ r, onPatch }: { r: SignupRow; onPatch: (p: Partial<SignupRow>) => void }) {
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
    if (r.level) details.push(r.level)
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
      <p className="text-[0.95rem] leading-snug">{details.join(' · ')}</p>
      <p className="text-xs text-muted">
        {myTime(r.created_at)}
        {r.personality ? ` · ${gameName(r.game) || 'Main'}: ${r.nickname} · ${PERSONALITY_INFO[r.personality].name} · ${r.total_xp} XP` : ''}
        {r.marketing ? ' · setuju terima tawaran' : ''}
      </p>
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

function BoardTab() {
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
        Papan skor hari ini, sama seperti di projektor. Sembunyikan nama yang tidak sesuai. Main yang terlalu pantas (mungkin
        ditipu) ditanda dan tidak dipaparkan.
      </p>
      <a className="clay-btn bg-white" href={`/tv?e=${eventSlug}`} target="_blank" rel="noreferrer">
        <Trophy size={18} /> Buka skrin projektor
      </a>
      {rows?.length === 0 && <p className="text-center text-muted">Belum ada pemain hari ini.</p>}
      {rows != null &&
        rows.length > 0 &&
        GAMES.map((g) => {
          const list = rows.filter((r) => (r.game ?? 'cikgu') === g)
          return (
            <section key={g} className="flex flex-col gap-2">
              <h3 className="mt-2 font-display text-xl font-extrabold">
                {g === 'cikgu' ? 'Top Cikgu Sehari' : 'Top Pelajar Bijak'}{' '}
                <span className="text-sm font-bold text-muted">· {list.length} nama · 5 teratas di projektor</span>
              </h3>
              {list.length === 0 && <p className="text-sm text-muted">Belum ada pemain {gameName(g)} hari ini.</p>}
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
    </div>
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
