import { spawn } from 'node:child_process'
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
            const q = new URL(req.url, 'http://x').searchParams
            if (req.headers['x-admin-key'] !== 'dev') throw new HttpError(401, 'Not allowed.')
            return send(200, await removeFromGuestbook(store, { id: q.get('id'), name: q.get('name'), last: q.get('last') === '1', all: q.get('all') === '1' }))
          }
          throw new HttpError(405, 'Method not allowed.')
        } catch (err) {
          send(err instanceof HttpError ? err.status : 500, { error: err.message })
        }
      })
    },
  }
}

// Dev only: `sudo sync-playlist` in the site's terminal runs the sync script
// right here instead of asking GitHub (password: dev). Vite reloads the songs.
function syncPlaylistDevApi() {
  let run = { status: 'none' }
  return {
    name: 'sync-playlist-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/sync-playlist', (req, res) => {
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.headers['x-admin-key'] !== 'dev') return send(401, { error: 'Not allowed.' })
        if (req.method === 'GET') return send(200, run)
        if (req.method !== 'POST') return send(405, { error: 'Method not allowed.' })
        if (run.status === 'in_progress') return send(202, { started: run.created })
        run = { status: 'in_progress', conclusion: null, created: new Date().toISOString() }
        const child = spawn(process.execPath, ['scripts/sync-playlist.mjs'], { cwd: path.resolve('.'), stdio: 'ignore' })
        child.on('exit', (code) => (run = { ...run, status: 'completed', conclusion: code === 0 ? 'success' : 'failure' }))
        send(202, { started: run.created })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), guestbookDevApi(), syncPlaylistDevApi()],
  // three.js is lazy-loaded with the Mixtape section, so a big chunk there is fine
  build: { chunkSizeWarningLimit: 1000 },
  // Phone testing on the same Wi-Fi: open http://<your-ip-with-dashes>.nip.io:5173
  // (e.g. 192-168-100-4.nip.io). YouTube refuses many embeds on bare IP addresses.
  server: { allowedHosts: ['.nip.io'] },
})
