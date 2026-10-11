import { useState } from 'react'
import { useStore, setState } from '../lib/store'
import { ACHIEVEMENTS } from '../data/eggs'
import { unlockAudio } from '../lib/sound'
import './Nav.css'

const LINKS = [
  ['#play', 'World 1-1'],
  ['#projects', 'Projects'],
  ['#skills', 'Inventory'],
  ['#mixtape', 'Mixtape'],
  ['#beyond', 'Beyond code'],
  ['#vault', 'Vault'],
  ['#contact', 'Contact'],
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const coins = useStore((s) => s.coins)
  const muted = useStore((s) => s.muted)
  const found = useStore((s) => Object.keys(s.achievements).length)
  const done = useStore((s) => !!s.achievements.completionist)

  return (
    <header className="nav">
      <a className="nav__logo" href="#play" onClick={() => setOpen(false)}>
        SAADSUBHANI<span>.EXE</span>
      </a>

      <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Sections">
        {LINKS.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>

      <div className="nav__stats">
        {done && <span className="nav__hundred">100%</span>}
        <a className="nav__pill" href="#trophies" title="Coins collected">
          🪙 <b>{coins}</b>
        </a>
        <a className="nav__pill" href="#trophies" title="Achievements found">
          🏆 <b>{found}/{ACHIEVEMENTS.length}</b>
        </a>
        <button
          className="nav__pill"
          onClick={() => {
            unlockAudio()
            setState({ muted: !muted })
          }}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          title={muted ? 'Sound off' : 'Sound on'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="nav__burger" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
