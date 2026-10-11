// Vercel function: the pixel guestbook, stored as private JSON files in Vercel Blob.
//   GET                      -> { submissions }
//   POST { pixels, name }    -> { submission, submissions }
//   DELETE ?all=1 | ?last=1 | ?name=… | ?id=…   (header x-admin-key: $GUESTBOOK_ADMIN_KEY)
//                                                 -> { removed, names }
import { del, get, list, put } from '@vercel/blob'
import { HttpError, addToGuestbook, readGuestbook, removeFromGuestbook } from './_lib/guestbook-core.js'

const PENDING = 'guestbook/submissions/'
const WALL = 'guestbook/wall-'
const PUT_OPTS = { access: 'private', addRandomSuffix: false, contentType: 'application/json' }

async function readJson(pathname) {
  const res = await get(pathname, { access: 'private', useCache: false })
  if (!res || res.statusCode !== 200) return null
  return JSON.parse(await new Response(res.stream).text())
}

async function listAll(prefix) {
  const blobs = []
  let cursor
  do {
    const page = await list({ prefix, cursor, limit: 1000 })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
}

// Snapshots get a new name each time (wall-<timestamp>.json) instead of being
// overwritten, so a cached copy can never be served as the latest.
const blobStore = {
  async listPending() {
    const blobs = await listAll(PENDING)
    const items = await Promise.all(blobs.map(async (b) => ({ key: b.pathname, data: await readJson(b.pathname) })))
    return items.filter((i) => i.data)
  },
  async readWall() {
    const walls = (await listAll(WALL)).sort((a, b) => b.pathname.localeCompare(a.pathname))
    return walls.length ? readJson(walls[0].pathname) : null
  },
  async writeWall(wall) {
    const old = await listAll(WALL)
    await put(`${WALL}${Date.now()}.json`, JSON.stringify(wall), PUT_OPTS)
    if (old.length) await del(old.map((b) => b.pathname))
  },
  async writePending(id, data) {
    await put(`${PENDING}${id}.json`, JSON.stringify(data), PUT_OPTS)
  },
  async deletePending(keys) {
    if (keys.length) await del(keys)
  },
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20')
      return res.status(200).json(await readGuestbook(blobStore))
    }
    if (req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      const out = await addToGuestbook(blobStore, req.body, { ip, salt: process.env.GUESTBOOK_ADMIN_KEY || 'guestbook' })
      res.setHeader('Cache-Control', 'no-store')
      return res.status(201).json(out)
    }
    if (req.method === 'DELETE') {
      const key = process.env.GUESTBOOK_ADMIN_KEY
      if (!key || req.headers['x-admin-key'] !== key) throw new HttpError(401, 'Not allowed.')
      const q = req.query
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json(await removeFromGuestbook(blobStore, { id: q.id, name: q.name, last: q.last === '1', all: q.all === '1' }))
    }
    res.setHeader('Allow', 'GET, POST, DELETE')
    throw new HttpError(405, 'Method not allowed.')
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    if (status === 500) console.error('guestbook error', err)
    return res.status(status).json({ error: status === 500 ? 'The wall is taking a nap. Try again later.' : err.message })
  }
}
