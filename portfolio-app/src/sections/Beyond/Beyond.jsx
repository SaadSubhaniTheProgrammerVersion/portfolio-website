import { useState } from 'react'
import { BEYOND } from '../../data/beyond'
import { foundEgg } from '../../lib/store'
import { sfx } from '../../lib/sound'
import Picture from '../../components/Picture'
import './Beyond.css'

const TILTS = [-4, 3, -2, 5, -3]

export default function Beyond() {
  const [flipped, setFlipped] = useState(() => new Set())
  const [honk, setHonk] = useState(0)

  const flip = (i) => {
    sfx('click')
    setFlipped((f) => {
      const n = new Set(f)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  }

  return (
    <section id="beyond" className="sec beyond">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">SIDE QUESTS</span>
          <h2 className="sec__title">
            Beyond <em>the code</em>
          </h2>
          <p className="sec__lede">Design, media, mentoring and community work. Tap a polaroid to flip it.</p>
        </div>

        <div className="board">
          {BEYOND.map((b, i) => (
            <button
              key={b.picture}
              className={`polaroid ${flipped.has(i) ? 'is-flipped' : ''}`}
              style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
              onClick={() => flip(i)}
              aria-pressed={flipped.has(i)}
            >
              <span className="polaroid__tape" aria-hidden="true" />
              <span className="polaroid__inner">
                <span className="polaroid__front">
                  <span className="polaroid__pic">
                    <Picture n={b.picture} alt={b.caption} emoji="🎨" />
                  </span>
                  <span className="polaroid__cap">{b.caption}</span>
                </span>
                <span className="polaroid__back">{b.back}</span>
              </span>
            </button>
          ))}

          {/* HIMYM: the blue French horn, peeking out from behind the board */}
          <button
            className={`horn ${honk ? 'is-honking' : ''}`}
            key={honk}
            onClick={() => {
              sfx('horn')
              setHonk((h) => h + 1)
              foundEgg('horn')
            }}
            aria-label="A blue French horn?"
            title="Is that… a blue French horn?"
          >
            <svg viewBox="0 0 64 48" aria-hidden="true">
              <circle cx="24" cy="24" r="15" fill="none" stroke="#2F6FD6" strokeWidth="6" />
              <circle cx="24" cy="24" r="7" fill="none" stroke="#2F6FD6" strokeWidth="4" />
              <path d="M36 15 L54 4 Q62 2 62 12 L62 36 Q62 46 54 44 L36 33 Z" fill="#2F6FD6" stroke="#1B0F16" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="15" fill="none" stroke="#1B0F16" strokeWidth="1.5" />
              <rect x="8" y="34" width="8" height="5" rx="1" fill="#F2C14E" stroke="#1B0F16" strokeWidth="1.5" />
            </svg>
            {honk > 0 && <span className="horn__note">I stole a blue French horn for you.</span>}
          </button>
        </div>
      </div>
    </section>
  )
}
