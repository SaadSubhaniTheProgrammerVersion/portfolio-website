// Vercel function: POST { code } -> { ok }. The real code lives only in the
// VAULT_CODE environment variable, never in the site's files.
import { checkVaultCode } from './_lib/vault-core.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const { status, body } = checkVaultCode({ code: req.body?.code, secret: process.env.VAULT_CODE, ip })
  return res.status(status).json(body)
}
