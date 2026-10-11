import { useState } from 'react'
import { SKILLS } from '../../data/skills'
import { sfx } from '../../lib/sound'
import './Skills.css'

export default function Skills() {
  const [active, setActive] = useState(null)
  return (
    <section id="skills" className="sec">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">INVENTORY</span>
          <h2 className="sec__title">
            Power-ups <em>collected</em>
          </h2>
          <p className="sec__lede">Hover or tap an item to inspect it.</p>
        </div>

        <div className="inv">
          {SKILLS.map((g) => (
            <div key={g.group} className="inv__group" style={{ '--c': g.color }}>
              <h3 className="inv__name">{g.group}</h3>
              <ul className="inv__grid">
                {g.items.map((s) => {
                  const id = `${g.group}:${s.name}`
                  return (
                    <li key={s.name}>
                      <button
                        className={`slot ${active === id ? 'is-active' : ''}`}
                        onMouseEnter={() => setActive(id)}
                        onMouseLeave={() => setActive((a) => (a === id ? null : a))}
                        onFocus={() => setActive(id)}
                        onBlur={() => setActive((a) => (a === id ? null : a))}
                        onClick={() => {
                          sfx('click')
                          setActive((a) => (a === id ? null : id))
                        }}
                        aria-describedby={`tip-${id}`}
                      >
                        <span className="slot__icon" aria-hidden="true">
                          {s.icon}
                        </span>
                        <span className="slot__name">{s.name}</span>
                        <span className="slot__tip" role="tooltip" id={`tip-${id}`}>
                          {s.stat}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
