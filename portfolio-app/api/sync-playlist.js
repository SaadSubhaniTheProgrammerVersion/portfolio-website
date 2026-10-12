// Vercel function behind the terminal's `sudo sync-playlist` command.
//   POST  -> asks GitHub to run the "Sync playlists" workflow
//   GET   -> status of the latest run, so the terminal can show progress
// Both need header x-admin-key: $GUESTBOOK_ADMIN_KEY (the same admin password).
// Needs GITHUB_DISPATCH_TOKEN: a fine-grained GitHub token for this repo with
// "Actions: Read and write".
const REPO = process.env.GITHUB_REPO || 'SaadSubhaniTheProgrammerVersion/portfolio-website'
const WORKFLOW = 'sync-playlist.yml'

const gh = (path, init = {}) =>
  fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...init.headers,
    },
  })

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const key = process.env.GUESTBOOK_ADMIN_KEY
  if (!key || req.headers['x-admin-key'] !== key) return res.status(401).json({ error: 'Not allowed.' })
  if (!process.env.GITHUB_DISPATCH_TOKEN) return res.status(500).json({ error: 'GITHUB_DISPATCH_TOKEN is not set in Vercel.' })

  try {
    if (req.method === 'POST') {
      const r = await gh('/dispatches', { method: 'POST', body: JSON.stringify({ ref: 'main' }) })
      if (r.status !== 204) return res.status(502).json({ error: `GitHub said ${r.status}: ${(await r.text()).slice(0, 160)}` })
      return res.status(202).json({ started: new Date().toISOString() })
    }
    if (req.method === 'GET') {
      const r = await gh('/runs?per_page=1&event=workflow_dispatch')
      if (!r.ok) return res.status(502).json({ error: `GitHub said ${r.status}` })
      const run = (await r.json()).workflow_runs?.[0]
      if (!run) return res.status(200).json({ status: 'none' })
      return res.status(200).json({ status: run.status, conclusion: run.conclusion, created: run.created_at, url: run.html_url })
    }
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  } catch {
    return res.status(502).json({ error: 'Could not reach GitHub. Try again in a bit.' })
  }
}
