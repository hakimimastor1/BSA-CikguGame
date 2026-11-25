import { eventSlug, online, sendQueuedSignup } from './api'

/**
 * Sign-ups that couldn't be saved at the booth (weak signal, "Teruskan ke WhatsApp") wait here, in
 * the phone's storage, and are sent when the signal is back: straight away, every 20 seconds while
 * the page is open, when the player comes back from WhatsApp, and the next time the game opens.
 * The server knows each form by its clientId, so sending one twice never makes two sign-ups.
 */
const KEY = 'bsa-signup-outbox'
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

interface Item {
  event: string
  playId: string | null
  data: Record<string, unknown> & { clientId: string }
  at: number
}

function read(): Item[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? (v as Item[]).filter((i) => i?.data?.clientId && Date.now() - i.at < MAX_AGE_MS) : []
  } catch {
    return []
  }
}

function write(items: Item[]) {
  try {
    if (items.length) localStorage.setItem(KEY, JSON.stringify(items))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage blocked (private mode): the send straight away below is the only try */
  }
}

const drop = (clientId: string) => write(read().filter((i) => i.data.clientId !== clientId))

let busy = false

/** Try every waiting sign-up once. `leaving`: the page is being hidden, so send with keepalive and don't wait. */
export async function flushOutbox(leaving = false) {
  if (!online) return
  const items = read()
  if (!items.length) return
  if (leaving) {
    // Fire and forget; whatever isn't confirmed is tried again next time (no duplicates).
    for (const it of items) void sendQueuedSignup(it.event, it.playId, it.data, true)
    return
  }
  if (busy) return
  busy = true
  try {
    for (const it of items) {
      const r = await sendQueuedSignup(it.event, it.playId, it.data)
      if (r !== 'retry') drop(it.data.clientId)
    }
  } finally {
    busy = false
  }
}

/** Keep a sign-up that couldn't be saved, and start trying to send it. */
export function queueSignup(playId: string | null, data: Item['data']) {
  if (!online) return
  const items = read().filter((i) => i.data.clientId !== data.clientId)
  write([...items, { event: eventSlug, playId, data, at: Date.now() }])
  // Send once now even if storage is blocked; the outbox covers the retries.
  void sendQueuedSignup(eventSlug, playId, data, true).then((r) => {
    if (r !== 'retry') drop(data.clientId)
  })
}

let started = false

/** Start sending waiting sign-ups (once per page). */
export function startOutbox() {
  if (!online || started) return
  started = true
  void flushOutbox()
  window.addEventListener('online', () => void flushOutbox())
  document.addEventListener('visibilitychange', () => void flushOutbox(document.visibilityState === 'hidden'))
  window.addEventListener('pagehide', () => void flushOutbox(true))
  window.setInterval(() => void flushOutbox(), 20000)
}
