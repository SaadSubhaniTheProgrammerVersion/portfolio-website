import { useEffect, useState } from 'react'
import { useStore, dismissToast } from '../lib/store'
import './Toasts.css'

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.slice(0, 3).map((t) => (
        <Toast key={t.id} t={t} />
      ))}
    </div>
  )
}

function Toast({ t }) {
  // "LEGEN… wait for it…" → "…DARY!"
  const [dary, setDary] = useState(false)
  useEffect(() => {
    const timers = [setTimeout(() => dismissToast(t.id), t.ms)]
    if (t.kind === 'legendary') timers.push(setTimeout(() => setDary(true), 2000))
    return () => timers.forEach(clearTimeout)
  }, [t])

  if (t.kind === 'legendary') {
    return (
      <div className="toast toast--legendary" onClick={() => dismissToast(t.id)}>
        <span className="toast__icon">👑</span>
        <div>
          <p className="toast__kicker">ACHIEVEMENT UNLOCKED · COMPLETIONIST</p>
          <p className="toast__title">{dary ? 'LEGEN… wait for it… DARY!' : 'LEGEN… wait for it…'}</p>
          {dary && <p className="toast__body">100% complete. You found everything. Enjoy the golden cursor.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`toast toast--${t.kind}`} onClick={() => dismissToast(t.id)}>
      <span className="toast__icon">{t.icon}</span>
      <div>
        <p className="toast__kicker">{t.kind === 'achievement' ? 'ACHIEVEMENT UNLOCKED' : t.title}</p>
        {t.kind === 'achievement' && <p className="toast__title">{t.title}</p>}
        <p className="toast__body">{t.body}</p>
      </div>
    </div>
  )
}
