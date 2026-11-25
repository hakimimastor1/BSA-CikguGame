// Read-only health check for the live Cikgu Sehari site. Writes nothing.
//
//   node scripts/smoke.mjs [event-slug]
//
// In the Claude cloud session, run with NODE_USE_ENV_PROXY=1 so fetch uses the proxy.
// Exit code 0 = all good, 1 = something failed (details printed).

const SITE = process.env.SITE || 'https://bsa-cikgu-sehari.netlify.app'
const API = process.env.API || 'https://bfsjskgqlcafydejotsc.supabase.co'
const KEY = process.env.KEY || 'sb_publishable_akNWAL0QIIlHenb7qceVGQ_diX8E1od'
const EVENT = process.argv[2] || 'peskon26'

const results = []
async function check(name, fn) {
  const t = performance.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, ms: Math.round(performance.now() - t), detail })
  } catch (e) {
    results.push({ name, ok: false, ms: Math.round(performance.now() - t), detail: String(e.message || e) })
  }
}

async function page(path, mustContain) {
  const res = await fetch(SITE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  if (!html.includes(mustContain)) throw new Error(`missing "${mustContain}"`)
  return `HTTP ${res.status}`
}

await check('game page', () => page(`/?e=${EVENT}`, 'Cikgu Sehari'))
await check('projector page', () => page(`/tv?e=${EVENT}`, 'id="root"'))
await check('admin page', () => page('/admin', 'id="root"'))
await check('app script', async () => {
  const html = await (await fetch(SITE + '/')).text()
  const src = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1]
  if (!src) throw new Error('no script tag')
  const res = await fetch(SITE + src)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return `${Math.round((await res.arrayBuffer()).byteLength / 1024)} KB`
})
await check('leaderboard', async () => {
  const res = await fetch(`${API}/rest/v1/rpc/leaderboard`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_event: EVENT }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${body.message ?? ''}`)
  return `${body.event?.name}: ${body.players} players today, top ${body.top?.length ?? 0}`
})

let failed = 0
for (const r of results) {
  if (!r.ok) failed++
  console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name.padEnd(15)} ${String(r.ms).padStart(5)} ms  ${r.detail}`)
}
process.exit(failed ? 1 : 0)
