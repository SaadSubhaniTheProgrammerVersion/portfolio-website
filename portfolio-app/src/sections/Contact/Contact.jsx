import { useEffect, useState } from 'react'
import { PROFILE } from '../../data/profile'
import { ACHIEVEMENTS } from '../../data/eggs'
import { useStore, addCoins } from '../../lib/store'
import { sfx } from '../../lib/sound'
import './Contact.css'

// Is the resume PDF actually there? (The dev server answers unknown paths
// with index.html, so check the content type, not just the status.)
function useFileExists(url) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(url, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok && (r.headers.get('content-type') || '').includes('pdf')))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url])
  return ok
}

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const hasResume = useFileExists(PROFILE.resume)
  const got = useStore((s) => s.achievements)
  const found = ACHIEVEMENTS.filter((a) => got[a.id]).length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email)
    } catch {
      // clipboard blocked: the mailto link still works
    }
    if (!copied) addCoins(1)
    sfx('coin')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section id="contact" className="sec contact">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">THE CASTLE</span>
          <h2 className="sec__title">
            Biscuits with <em>the Boss?</em>
          </h2>
          <p className="sec__lede">
            Building something distributed, secure or slightly unhinged? Let's talk. I'll bring the biscuits.
          </p>
        </div>

        <div className="contact__grid">
          <div className="card contact__card">
            <p className="contact__label">EMAIL</p>
            <a className="contact__email" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>
            <div className="contact__btns">
              <button className="btn btn--gold btn--sm" onClick={copy}>
                {copied ? '🪙 Copied!' : 'Copy email'}
              </button>
              <a className="btn btn--sm" href={`mailto:${PROFILE.email}`}>
                Say hi ✉️
              </a>
            </div>
          </div>

          <a className="card contact__tile contact__tile--li" href={PROFILE.linkedin} target="_blank" rel="noreferrer">
            <span className="contact__big">in</span>
            <span>LinkedIn</span>
            <small>Press the Connect button ↗</small>
          </a>
          <a className="card contact__tile contact__tile--gh" href={PROFILE.github} target="_blank" rel="noreferrer">
            <span className="contact__big">{'</>'}</span>
            <span>GitHub</span>
            <small>Where the commits live ↗</small>
          </a>
          {hasResume ? (
            <a className="card contact__tile contact__tile--cv" href={PROFILE.resume} download>
              <span className="contact__big">📄</span>
              <span>Resume</span>
              <small>Saad's Journal, PDF ↓</small>
            </a>
          ) : (
            <div className="card contact__tile contact__tile--cv is-off" title="Resume coming soon">
              <span className="contact__big">📄</span>
              <span>Resume</span>
              <small>Loading… (coming soon)</small>
            </div>
          )}
        </div>

        <div id="trophies" className="trophies">
          <div className="trophies__head">
            <h3 className="trophies__title">Trophy shelf</h3>
            <p className="pixel trophies__count">
              {found}/{ACHIEVEMENTS.length} FOUND
            </p>
          </div>
          <div className="trophies__bar" aria-hidden="true">
            <span style={{ width: `${(found / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          <ul className="trophies__grid">
            {ACHIEVEMENTS.map((a) => {
              const has = !!got[a.id]
              return (
                <li key={a.id} className={`trophy ${has ? 'is-got' : ''}`}>
                  <span className="trophy__icon">{has ? a.icon : '❓'}</span>
                  <span className="trophy__name">{has ? a.name : '???'}</span>
                  <span className="trophy__how">{has ? a.how : 'Keep exploring…'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
