import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { dealCrate, MODES } from '../../data/mixtape'
import { foundEgg, unlock } from '../../lib/store'
import { sfx } from '../../lib/sound'
import { useYouTube } from './useYouTube'
import './Mixtape.css'

const Turntable3D = lazy(() => import('./Turntable3D'))

// fixed rain layout, so renders stay pure
const DROPS = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 20) / 20,
  dur: 0.55 + ((i * 7) % 10) / 25,
}))

export default function Mixtape() {
  const stageRef = useRef(null)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('international')
  const [tracks, setTracks] = useState(() => dealCrate('international'))
  const [deals, setDeals] = useState(0)
  const [track, setTrack] = useState(null)
  const [note, setNote] = useState('')
  const [raining, setRaining] = useState(false)
  const [pineapple, setPineapple] = useState(false)
  const played = useRef(new Set())
  const errors = useRef(0)

  const idx = track ? tracks.findIndex((t) => t.youtubeId === track.youtubeId) : -1

  const { hostRef, state: ytState, load, toggle, volume, setVolume } = useYouTube({
    onPlaying: () => {
      errors.current = 0
      if (track) played.current.add(track.youtubeId)
      if (played.current.size >= 3) unlock('audiophile')
    },
    onEnded: () => step(1),
    onError: () => {
      errors.current += 1
      setNote('This record is scratched (YouTube won’t let it play here). Skipping…')
      if (errors.current < tracks.length) setTimeout(() => step(1), 1400)
    },
  })

  function pick(t) {
    sfx('click')
    setTrack(t)
    setNote('')
    load(t.youtubeId)
  }
  function step(d) {
    const n = tracks.length
    pick(tracks[idx < 0 ? (d > 0 ? 0 : n - 1) : (idx + d + n) % n])
  }
  // Deal a new crate (from the chosen playlist). Whatever's playing keeps playing.
  function deal(nextMode = mode) {
    sfx('coin')
    setMode(nextMode)
    setTracks((prev) => dealCrate(nextMode, nextMode === mode ? prev.map((t) => t.youtubeId) : []))
    setDeals((n) => n + 1)
  }

  // Load the 3D chunk a bit before it scrolls into view; render only while visible.
  useEffect(() => {
    const el = stageRef.current
    const nearIo = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '600px' })
    const visIo = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    nearIo.observe(el)
    visIo.observe(el)
    return () => {
      nearIo.disconnect()
      visIo.disconnect()
    }
  }, [])

  const playing = ytState === 'playing'

  const umbrella = () => {
    sfx('click')
    setRaining(true)
    foundEgg('umbrella')
    setTimeout(() => setRaining(false), 4500)
  }

  return (
    <section id="mixtape" className="sec mixtape">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">SIDE B</span>
          <h2 className="sec__title">
            The <em>mixtape</em>
          </h2>
          <p className="sec__lede">
            Handpicked, heavily replayed. Pick a record from the crate and drop the needle. (Drag the deck to look around.)
          </p>
        </div>

        <div className="deck">
          <div className="deck__stage" ref={stageRef}>
            <div className="deck__canvas">
              {near && (
                <Suspense fallback={<p className="deck__loading pixel">LOADING DECK…</p>}>
                  <Turntable3D track={track} playing={playing} active={visible} />
                </Suspense>
              )}
            </div>
            {raining && (
              <div className="rain" aria-hidden="true">
                {DROPS.map((d, i) => (
                  <span key={i} style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
                ))}
              </div>
            )}
            <button className="pineapple" onClick={() => setPineapple((p) => !p)} aria-label="A pineapple?">
              🍍
              {pineapple && <span className="pineapple__note">The Pineapple Incident: we don’t talk about it.</span>}
            </button>
            {track && (
              <p className="deck__now">
                <span className={`deck__dot ${playing ? 'is-on' : ''}`} /> {playing ? 'NOW SPINNING' : 'ON DECK'} · {track.title}
              </p>
            )}
          </div>

          <div className="tv">
            <div className="tv__antenna" aria-hidden="true" />
            <div className="tv__body">
              <div className="tv__screen">
                <div className="tv__player" ref={hostRef} />
                {!track && (
                  <div className="tv__static">
                    <span className="pixel">NO SIGNAL</span>
                    <small>pick a record ↓</small>
                  </div>
                )}
              </div>
              <div className="tv__panel">
                <div className="tv__meta">
                  <p className="tv__title">{track ? track.title : 'Nothing playing'}</p>
                  <p className="tv__artist">{track ? track.artist : 'The crate awaits'}</p>
                </div>
                <div className="tv__ctrls">
                  <button onClick={() => step(-1)} aria-label="Previous record">
                    ⏮
                  </button>
                  <button onClick={() => (track ? toggle() : pick(tracks[0]))} aria-label={playing ? 'Pause' : 'Play'} className="tv__play">
                    {playing ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => step(1)} aria-label="Next record">
                    ⏭
                  </button>
                </div>
                <label className="tv__vol">
                  <span aria-hidden="true">🔉</span>
                  <span className="sr-only">Volume</span>
                  <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
                </label>
              </div>
            </div>
            {note && <p className="tv__note">{note}</p>}
          </div>
        </div>

        <div className="picker">
          <div className="picker__body">
            <p className="picker__label">SAAD'S MIXTAPE</p>
            <p className="picker__text">
              Every record in this crate is pulled at random from a mixtape I curated myself. Pick a side, then dig in.
            </p>
          </div>
          <div className="picker__toggle" role="radiogroup" aria-label="Music">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={mode === m.id}
                className={mode === m.id ? 'is-on' : ''}
                onClick={() => mode !== m.id && deal(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button className="btn btn--gold btn--sm picker__shuffle" onClick={() => deal()}>
            Shuffle the crate 🔀
          </button>
        </div>

        <div className="crate" aria-label="Record crate">
          <div className="crate__rack" key={deals}>            {tracks.map((t, i) => (
              <button
                key={t.youtubeId}
                className={`sleeve ${idx === i ? 'is-on' : ''}`}
                style={{ '--c': t.color, '--thumb': `url(https://i.ytimg.com/vi/${t.youtubeId}/mqdefault.jpg)` }}
                onClick={() => pick(t)}
                aria-pressed={idx === i}
              >
                <span className="sleeve__art" aria-hidden="true">
                  <span className="sleeve__vinyl" />
                </span>
                <span className="sleeve__title">{t.title}</span>
                <span className="sleeve__artist">{t.artist}</span>
              </button>
            ))}
            <button className="sleeve sleeve--umbrella" onClick={umbrella} aria-label="A yellow umbrella, tucked in the crate">
              <span className="sleeve__umb" aria-hidden="true">
                <svg viewBox="0 0 64 64">
                  <path d="M4 30 Q32 -4 60 30 Q53 25 46 30 Q39 25 32 30 Q25 25 18 30 Q11 25 4 30 Z" fill="#FFD21F" stroke="#1B0F16" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M32 6 V30 M18 30 Q22 14 32 6 M46 30 Q42 14 32 6" fill="none" stroke="#E0A800" strokeWidth="2" />
                  <path d="M32 30 V52 Q32 60 25 59 Q20 58 21 52" fill="none" stroke="#1B0F16" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </div>
          <div className="crate__front" aria-hidden="true">
            <span>SAAD'S CRATE · DO NOT TOUCH (PLEASE TOUCH)</span>
          </div>
        </div>
      </div>
    </section>
  )
}
