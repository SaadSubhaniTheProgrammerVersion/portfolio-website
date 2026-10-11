import { emit } from '../lib/store'
import { PROFILE } from '../data/profile'
import ImpalaDrive from './ImpalaDrive'
import './Footer.css'

const TICKER = ['DISTRIBUTED SYSTEMS', '★', 'PAYMENT ENGINES', '★', 'ENTERPRISE IAM', '★', 'APPLIED AI', '★', 'VISUAL DESIGN', '★', 'ELITE MUSIC TASTE', '★']

export default function Footer() {
  return (
    <footer className="foot">
      <div className="marq">
        <div className="marq__clip" aria-hidden="true">
          <div className="marq__row">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
        <ImpalaDrive />
      </div>
      <div className="wrap foot__inner">
        <p className="foot__name">{PROFILE.name}</p>
        <p className="foot__small">
          Built with React, Three.js and too much chai. No Nintendo plumbers were harmed.
        </p>
        <button className="foot__term" onClick={() => emit('terminal')} aria-label="Open terminal" title="psst">
          {'>_'}
        </button>
      </div>
    </footer>
  )
}
