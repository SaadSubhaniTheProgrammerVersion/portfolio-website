import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { HttpError, addToGuestbook, readGuestbook, removeFromGuestbook } from './api/_lib/guestbook-core.js'

// Dev only: answers /api/guestbook like the Vercel function does, but keeps
// the wall in a local, git-ignored .guestbook-dev.json instead of Vercel Blob.
function guestbookDevApi() {
  const file = path.resolve('.guestbook-dev.json')
  const load = () => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { pending: {}, wall: null })
  const save = (db) => fs.writeFileSync(file, JSON.stringify(db, null, 2))
  const store = {
    listPending: async () => Object.entries(load().pending).map(([key, data]) => ({ key, data })),
    readWall: async () => load().wall,
    writeWall: async (wall) => save({ ...load(), wall }),
    writePending: async (key, data) => {
      const db = load()
      db.pending[key] = data
      save(db)
    },
    deletePending: async (keys) => {
      const db = load()
      keys.forEach((k) => delete db.pending[k])
      save(db)
    },
  }
  const readBody = (req) =>
    new Promise((resolve) => {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
        try {
          resolve(JSON.parse(raw || '{}'))
        } catch {
          resolve({})
        }
      })
    })
  return {
    name: 'guestbook-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/guestbook', async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        try {
          if (req.method === 'GET') return send(200, await readGuestbook(store))
          if (req.method === 'POST') return send(201, await addToGuestbook(store, await readBody(req), { ip: req.socket.remoteAddress, salt: 'dev' }))
          if (req.method === 'DELETE') {
            const id = new URL(req.url, 'http://x').searchParams.get('id')
            if (req.headers['x-admin-key'] !== 'dev') throw new HttpError(401, 'Not allowed.')
            return send(200, await removeFromGuestbook(store, id))
          }
          throw new HttpError(405, 'Method not allowed.')
        } catch (err) {
          send(err instanceof HttpError ? err.status : 500, { error: err.message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), guestbookDevApi()],
  // three.js is lazy-loaded with the Mixtape section, so a big chunk there is fine
  build: { chunkSizeWarningLimit: 1000 },
  // Phone testing on the same Wi-Fi: open http://<your-ip-with-dashes>.nip.io:5173
  // (e.g. 192-168-100-4.nip.io). YouTube refuses many embeds on bare IP addresses.
  server: { allowedHosts: ['.nip.io'] },
})
