// Syncs the mixtape with Saad's two Spotify playlists (International + Local).
//
//   npm run sync-playlist
//
// 1. Reads the playlist's song names from Spotify. Without credentials it
//    uses the public embed, which only lists the first 100 songs. Set
//    SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (a free app at
//    developer.spotify.com) to read the whole playlist.
// 2. Finds each song on YouTube and keeps the first result that allows
//    embedding, so it can play on the site.
// 3. Writes src/data/playlist.json. Songs already matched are reused, so
//    re-running only searches for new songs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PLAYLISTS = {
  international: '4DP22n5dhbiXOhGEVuBmex',
  local: '4s3FTIyQS8nbjABJGYybHL',
}
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/playlist.json')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// fetch with retries: YouTube rate-limits bursts of requests
async function get(url, opts = {}, tries = 5) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, opts).catch(() => null)
    if (r && (r.ok || r.status === 401 || r.status === 404 || r.status === 400 || r.status === 403)) return r
    if (i >= tries) return r
    await sleep(1500 * 2 ** i)
  }
}

async function fromApi(PLAYLIST_ID, id, secret) {
  const tok = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  }).then((r) => r.json())
  const meta = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}?fields=name`, {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  }).then((r) => r.json())
  const tracks = []
  let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100&fields=next,items(track(uri,name,artists(name)))`
  while (url) {
    const page = await fetch(url, { headers: { Authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json())
    for (const { track } of page.items) {
      if (track) tracks.push({ uri: track.uri, title: track.name, artist: track.artists.map((a) => a.name).join(', ') })
    }
    url = page.next
  }
  return { name: meta.name, tracks }
}

async function fromEmbed(PLAYLIST_ID) {
  const html = await get(`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}`, { headers: { 'User-Agent': UA } }).then((r) => r.text())
  const json = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1]
  if (!json) throw new Error('Could not read the Spotify embed page')
  const entity = JSON.parse(json).props.pageProps.state.data.entity
  return {
    name: entity.name,
    tracks: entity.trackList.map((t) => ({ uri: t.uri, title: t.title, artist: t.subtitle.replace(/ /g, ' ') })),
  }
}

// "Bohemian Rhapsody - Remastered 2011" → "Bohemian Rhapsody" (for searching only)
const searchTitle = (t) => t.replace(/\s+-\s+.*$/, '').replace(/\s*[([].*?[)\]]/g, '').trim()

async function embeddable(videoId) {
  const r = await get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
  return r.ok ? r.json() : null
}

async function findOnYouTube({ title, artist }) {
  const q = `${artist.split(',')[0]} ${searchTitle(title)}`
  const html = await get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  }).then((r) => r.text())
  const ids = [...new Set([...html.matchAll(/"videoRenderer":\{"videoId":"([\w-]{11})"/g)].map((m) => m[1]))].slice(0, 6)
  const words = searchTitle(title).toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  let fallback = null
  for (const id of ids) {
    const info = await embeddable(id)
    if (!info) continue
    const t = info.title.toLowerCase()
    if (!words.length || words.some((w) => t.includes(w))) return id
    fallback ??= id
  }
  return fallback
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    }),
  )
  return out
}

const { SPOTIFY_CLIENT_ID: cid, SPOTIFY_CLIENT_SECRET: csecret } = process.env
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
const result = {}

for (const [key, id] of Object.entries(PLAYLISTS)) {
  const playlist = cid && csecret ? await fromApi(id, cid, csecret) : await fromEmbed(id)
  console.log(`\n[${key}] "${playlist.name}": ${playlist.tracks.length} songs${cid ? '' : ' (public embed, max 100)'}`)

  const known = new Map((previous[key]?.tracks || []).map((t) => [t.uri, t.youtubeId]))
  const seen = new Set()
  const unique = playlist.tracks.filter((t) => {
    const k = `${searchTitle(t.title)}|${t.artist}`.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const missing = []
  const tracks = (
    await pool(unique, 2, async (t) => {
      const youtubeId = known.get(t.uri) || (await findOnYouTube(t).catch(() => null))
      if (!youtubeId) missing.push(`${t.title} · ${t.artist}`)
      return youtubeId ? { ...t, youtubeId } : null
    })
  ).filter(Boolean)

  result[key] = { name: playlist.name, url: `https://open.spotify.com/playlist/${id}`, tracks }
  console.log(`[${key}] ${tracks.length} playable songs`)
  if (missing.length) console.log(`[${key}] no playable YouTube match for:\n  ${missing.join('\n  ')}`)
}

// Only touch the file if a song actually changed, so an unchanged playlist
// doesn't produce a commit (and a redeploy) just for a new date.
const previousSongs = { ...previous }
delete previousSongs.synced
if (JSON.stringify(previousSongs) === JSON.stringify(result)) {
  console.log('\nNo playlist changes.')
} else {
  fs.writeFileSync(OUT, JSON.stringify({ synced: new Date().toISOString().slice(0, 10), ...result }, null, 2) + '\n')
  console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`)
}
