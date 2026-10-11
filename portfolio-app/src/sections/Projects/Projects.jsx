import { PROJECTS } from '../../data/projects'
import { emit } from '../../lib/store'
import Picture from '../../components/Picture'
import './Projects.css'

export default function Projects() {
  return (
    <section id="projects" className="sec sec--alt">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">LEVEL SELECT</span>
          <h2 className="sec__title">
            Pick a <em>cartridge</em>
          </h2>
          <p className="sec__lede">Things I've built, from award-winning AI to PONG written in Assembly. One of them is actually playable.</p>
        </div>

        <ul className="carts">
          {PROJECTS.map((p, i) => (
            <li key={p.id} className="cart" style={{ '--c': p.color, '--tilt': `${i % 2 ? 0.8 : -0.8}deg` }}>
              <div className="cart__top" aria-hidden="true">
                <span className="cart__ridges" />
                <span className="cart__num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="cart__label">
                {p.picture && (
                  <div className="cart__pic">
                    <Picture n={p.picture} alt={p.title} emoji="🩻" />
                  </div>
                )}
                {p.award && <span className="cart__award">🏆 {p.award}</span>}
                <h3 className="cart__title">{p.title}</h3>
                <p className="cart__tag">{p.tag}</p>
              </div>
              <p className="cart__body">{p.body}</p>
              <ul className="cart__stack">
                {p.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
              {p.playable && (
                <button className="btn btn--gold btn--sm cart__play" onClick={() => emit('pong')}>
                  ▶ Insert coin & play
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
