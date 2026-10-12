import { useEffect, useState } from 'react'
import { unlockAudio, sfx } from '../lib/sound'
import { setState } from '../lib/store'
import './Boot.css'

const KEY = 'saad.exe.booted'

function alreadyBooted() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// "PRESS START". Shown once per browser session. The click also unlocks
// audio, since browsers only allow sound after a user gesture.
export default function Boot() {
  const [show, setShow] = useState(() => !alreadyBooted())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    setState({ modal: 'boot' })
    const start = () => {
      setState({ modal: null })
      unlockAudio()
      sfx('coin')
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        // ignore
      }
      setLeaving(true)
      setTimeout(() => setShow(false), 450)
    }
    const key = (e) => {
      if (['Enter', 'Space'].includes(e.code)) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', key)
    window.addEventListener('pointerdown', start)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('pointerdown', start)
      document.documentElement.style.overflow = ''
    }
  }, [show])

  // After the boot screen, the first interaction anywhere still unlocks audio.
  useEffect(() => {
    if (show) return
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [show])

  if (!show) return null
  return (
    <div className={`boot ${leaving ? 'boot--out' : ''}`} role="dialog" aria-label="Press start">
      <div className="boot__clouds" aria-hidden="true" />
      <p className="boot__by">SAAD SUBHANI PRESENTS</p>
      <h1 className="boot__logo">
        SAAD&apos;S
        <br />
        <span>PLAYGROUND</span>
      </h1>
      <p className="boot__sub">a playable portfolio</p>
      <button className="boot__start">▶ PRESS START</button>
      <p className="boot__hint">click · tap · or hit enter</p>
      <p className="boot__copy">© 2002–{new Date().getFullYear()} · 1 PLAYER · ∞ COINS</p>
    </div>
  )
}
