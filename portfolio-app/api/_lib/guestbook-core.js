// Pixel guestbook logic, independent of where the files live. The Vercel
// function plugs in Vercel Blob; the Vite dev server plugs in a local file.
//
// A store must provide:
//   listPending()        -> [{ key, data }]   one file per submission
//   readWall()           -> { submissions, mergedUpTo } | null
//   writeWall(wall)      -> void              compacted snapshot
//   writePending(key, d) -> void
//   deletePending(keys)  -> void
import { createHash, randomBytes } from 'node:crypto'

export const COLS = 32
export const ROWS = 20
export const PALETTE_SIZE = 10
export const MAX_PIXELS = 5
export const MAX_NAME = 24
const COMPACT_AT = 40
const IP_LIMIT = 3 // per network per 24h, so a shared office/campus Wi-Fi still works
const DAY = 24 * 60 * 60 * 1000

const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'rape', 'porn', 'dick', 'pussy']

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function cleanName(raw) {
  if (raw == null) return ''
  // strip control characters (and anything below space)
  const name = [...String(raw)].filter((ch) => ch >= ' ' && ch !== '\u007f').join('').replace(/\s+/g, ' ').trim()
  if (name.length > MAX_NAME) throw new HttpError(400, `Names can be at most ${MAX_NAME} characters.`)
  const flat = name.toLowerCase().replace(/[^a-z]/g, '')
  if (BLOCKED.some((w) => flat.includes(w))) throw new HttpError(400, "Let's keep the wall friendly. Try another name.")
  return name
}

export function validatePixels(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_PIXELS) {
    throw new HttpError(400, `Place between 1 and ${MAX_PIXELS} pixels.`)
  }
  const seen = new Set()
  return raw.map((p) => {
    if (!Array.isArray(p) || p.length !== 3) throw new HttpError(400, 'Bad pixel.')
    const [x, y, c] = p.map(Number)
    const ok = (v, max) => Number.isInteger(v) && v >= 0 && v < max
    if (!ok(x, COLS) || !ok(y, ROWS) || !ok(c, PALETTE_SIZE)) throw new HttpError(400, 'Pixel out of bounds.')
    const k = `${x},${y}`
    if (seen.has(k)) throw new HttpError(400, 'Two pixels in the same spot.')
    seen.add(k)
    return [x, y, c]
  })
}

export function hashIp(ip, salt) {
  return createHash('sha256').update(`${salt}:${ip || 'unknown'}`).digest('hex').slice(0, 16)
}

// Everything on the wall, oldest first (later pixels paint over earlier ones).
async function allSubmissions(store, { compact = false } = {}) {
  const wall = (await store.readWall()) || { submissions: [], mergedUpTo: 0 }
  const pending = (await store.listPending()).sort((a, b) => a.data.at - b.data.at)
  const known = new Set(wall.submissions.map((s) => s.id))
  const fresh = pending.map((p) => p.data).filter((s) => !known.has(s.id))
  const submissions = [...wall.submissions, ...fresh].sort((a, b) => a.at - b.at)
  if (compact && pending.length >= COMPACT_AT) {
    await store.writeWall({ submissions, mergedUpTo: Date.now() })
    await store.deletePending(pending.map((p) => p.key))
  }
  return submissions
}

// What visitors get: no network fingerprints.
const publicView = (subs) => subs.map(({ id, at, name, pixels }) => ({ id, at, name, pixels }))

export async function readGuestbook(store) {
  return { submissions: publicView(await allSubmissions(store, { compact: true })) }
}

export async function addToGuestbook(store, body, { ip, salt }) {
  const pixels = validatePixels(body?.pixels)
  const name = cleanName(body?.name)
  const ipHash = hashIp(ip, salt)
  const all = await allSubmissions(store)
  const recent = all.filter((s) => s.ipHash === ipHash && Date.now() - s.at < DAY)
  if (recent.length >= IP_LIMIT) throw new HttpError(429, 'This network has signed the wall a few times today already. Try again tomorrow!')
  const at = Date.now()
  const id = `${at.toString(36)}-${randomBytes(4).toString('hex')}`
  const submission = { id, at, name, pixels, ipHash }
  await store.writePending(id, submission)
  return { submission: publicView([submission])[0], submissions: publicView([...all, submission]) }
}

export async function removeFromGuestbook(store, id) {
  const all = await allSubmissions(store)
  if (!all.some((s) => s.id === id)) throw new HttpError(404, 'No submission with that id.')
  const pending = await store.listPending()
  await store.writeWall({ submissions: all.filter((s) => s.id !== id), mergedUpTo: Date.now() })
  await store.deletePending(pending.map((p) => p.key))
  return { removed: id }
}
