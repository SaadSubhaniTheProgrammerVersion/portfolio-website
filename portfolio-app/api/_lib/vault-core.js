// Checks the vault code on the server, so the code never ships to the browser.
import { timingSafeEqual } from 'node:crypto'

const WINDOW = 10 * 60 * 1000 // 10 minutes
const MAX_WRONG = 12 // wrong guesses per network per window
const wrong = new Map() // ip -> [timestamps]   (per server instance; enough to stop a script)

export function checkVaultCode({ code, secret, ip }) {
  if (!secret) return { status: 500, body: { error: 'VAULT_CODE is not set.' } }
  const now = Date.now()
  const recent = (wrong.get(ip) || []).filter((t) => now - t < WINDOW)
  if (recent.length >= MAX_WRONG) return { status: 429, body: { ok: false, error: 'Too many tries. The vault needs a 10 minute break.' } }

  const a = Buffer.from(String(code ?? ''))
  const b = Buffer.from(String(secret))
  const ok = a.length === b.length && timingSafeEqual(a, b)
  if (ok) {
    wrong.delete(ip)
    return { status: 200, body: { ok: true } }
  }
  wrong.set(ip, [...recent, now])
  return { status: 401, body: { ok: false } }
}
