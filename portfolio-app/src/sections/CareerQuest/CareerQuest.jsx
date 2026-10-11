import { useEffect, useMemo, useRef, useState } from 'react'
import { Engine } from './engine'
import { buildLevel, WORLD_W, WORLD_H, GROUND, T, CASTLE_X, FLAG_X } from './level'
import { PlayerSprite, BugSprite, Impala } from './sprites'
import { MILESTONES } from '../../data/milestones'
import { PROFILE } from '../../data/profile'
import Picture from '../../components/Picture'
import { useStore, getState, addCoins, unlock, foundEgg, on } from '../../lib/store'
import './CareerQuest.css'

const BY_ID = Object.fromEntries(MILESTONES.map((m) => [m.id, m]))
const MAIN_COUNT = MILESTONES.length

// Deterministic scenery for the parallax layer.
const PARALLAX_W = WORLD_W * 0.35 + 1600
const CLOUDS = Array.from({ length: Math.ceil(PARALLAX_W / 260) }, (_, i) => ({
  x: i * 260 + ((i * 97) % 120),
  y: 30 + ((i * 53) % 90),
  s: 0.7 + ((i * 31) % 50) / 100,
}))
const HILLS = Array.from({ length: Math.ceil(PARALLAX_W / 420) }, (_, i) => ({
  x: i * 420 + ((i * 71) % 160),
  s: 0.8 + ((i * 43) % 60) / 100,
}))
const BUSHES = [470, 1080, 1560, 2450, 2960, 3480]

function useMap() {
  const ref = useRef(null)
  if (ref.current === null) ref.current = new Map()
  return ref
}

export default function CareerQuest() {
  const level = useMemo(() => buildLevel(), [])
  const suit = useStore((s) => s.suit)
  const coins = useStore((s) => s.coins)

  const vpRef = useRef(null)
  const worldRef = useRef(null)
  const parallaxRef = useRef(null)
  const playerRef = useRef(null)
  const ballRef = useRef(null)
  const bubbleRef = useRef(null)
  const pieRef = useRef(null)
  const impalaRef = useRef(null)
  const flagRef = useRef(null)
  const timeRef = useRef(null)
  const blocks = useMap()
  const bugs = useMap()
  const coinEls = useMap()
  const engineRef = useRef(null)

  const [card, setCard] = useState(null)
  const [visited, setVisited] = useState(() => new Set())
  const [finish, setFinish] = useState(null)
  const [ended, setEnded] = useState(false)
  const [listView, setListView] = useState(false)
  const [inView, setInView] = useState(true)

  // Build the engine once the DOM exists.
  useEffect(() => {
    const engine = new Engine(
      {
        world: worldRef.current,
        parallax: parallaxRef.current,
        player: playerRef.current,
        ball: ballRef.current,
        ballBubble: bubbleRef.current,
        pie: pieRef.current,
        impala: impalaRef.current,
        flag: flagRef.current,
        time: timeRef.current,
        blocks: blocks.current,
        bugs: bugs.current,
        coins: coinEls.current,
      },
      {
        onBump: (id) => {
          setCard(BY_ID[id])
          setVisited((v) => (v.has(id) ? v : new Set(v).add(id)))
        },
        onCoin: () => addCoins(1),
        onStomp: (all) => {
          addCoins(1)
          if (all) unlock('squasher')
        },
        onEgg: (egg) => foundEgg(egg),
        onFlag: (ms) => {
          setFinish(ms)
          if (ms > 0 && ms < 30000) unlock('speedrun')
        },
        onEnd: () => setEnded(true),
      },
    )
    engineRef.current = engine
    if (import.meta.env.DEV) window.__engine = engine

    const vp = vpRef.current
    const ro = new ResizeObserver(() => engine.setViewport(vp.clientWidth, vp.clientHeight))
    ro.observe(vp)
    engine.setViewport(vp.clientWidth, vp.clientHeight)

    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio > 0.35), {
      threshold: [0, 0.35, 0.6],
    })
    io.observe(vp)

    const offChristo = on('christo', () => engine.christo())

    // HUD clock, updated outside React
    let raf
    const clock = () => {
      if (timeRef.current) {
        const ms = engine.startTime && engine.phase === 'play' ? performance.now() - engine.startTime : 0
        if (engine.phase === 'play') timeRef.current.textContent = (ms / 1000).toFixed(1)
      }
      raf = requestAnimationFrame(clock)
    }
    raf = requestAnimationFrame(clock)

    return () => {
      engine.stop()
      ro.disconnect()
      io.disconnect()
      offChristo()
      cancelAnimationFrame(raf)
    }
  }, [blocks, bugs, coinEls])

  // Run the loop only while the level is on screen and visible.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (inView && !listView) engine.start()
    else engine.stop()
  }, [inView, listView])

  // Pause while a milestone card is open.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.paused = !!card
    engine.input.left = engine.input.right = engine.input.jump = false
  }, [card])

  // Keyboard controls (only while the level is on screen).
  useEffect(() => {
    if (!inView || listView) return
    const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' }
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable
    // The jump that opens a card is still held when the card appears, so a
    // card only closes on a key that was pressed *after* it opened.
    let armed = false
    const down = (e) => {
      if (typing(e) || getState().modal) return
      if (card) {
        if (['Space', 'Enter', 'Escape'].includes(e.code)) {
          e.preventDefault()
          if (!e.repeat) armed = true
        }
        return
      }
      const k = map[e.code]
      if (!k) return
      e.preventDefault()
      engineRef.current.input[k] = true
    }
    const up = (e) => {
      if (card) {
        if (armed && ['Space', 'Enter', 'Escape'].includes(e.code)) setCard(null)
        return
      }
      const k = map[e.code]
      if (k) engineRef.current.input[k] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [inView, listView, card])

  const press = (k, v) => (e) => {
    e.preventDefault()
    if (engineRef.current) engineRef.current.input[k] = v
  }
  const pad = (k) => ({
    onPointerDown: press(k, true),
    onPointerUp: press(k, false),
    onPointerLeave: press(k, false),
    onPointerCancel: press(k, false),
    onContextMenu: (e) => e.preventDefault(),
  })

  const restart = () => {
    setEnded(false)
    setFinish(null)
    setCard(null)
    engineRef.current?.reset()
  }

  const setRef = (map, id) => (el) => {
    if (el) map.current.set(id, el)
    else map.current.delete(id)
  }

  return (
    <section id="play" className="quest" aria-label="World 1-1: Saad's career, as a playable level">
      <h1 className="sr-only">Saad Subhani, Software Engineer</h1>

      <div className={`quest__viewport ${listView ? 'is-hidden' : ''}`} ref={vpRef}>
        <div className="quest__parallax" ref={parallaxRef} style={{ width: PARALLAX_W, height: WORLD_H }} aria-hidden="true">
          {HILLS.map((h, i) => (
            <div key={i} className="hill" style={{ left: h.x, top: GROUND - 90 * h.s, width: 260 * h.s, height: 180 * h.s }} />
          ))}
          {CLOUDS.map((c, i) => (
            <div key={i} className="cloud" style={{ left: c.x, top: c.y, transform: `scale(${c.s})` }} />
          ))}
        </div>

        <div className="quest__world" ref={worldRef} style={{ width: WORLD_W, height: WORLD_H }}>
          {/* Start sign */}
          <div className="sign" style={{ left: 40, top: GROUND - 232 }}>
            <div className="sign__board">
              <div className="sign__top">
                <Picture n={1} alt="Saad" className="sign__pic" emoji="🙂" />
                <p className="sign__title">
                  Haaave you met <em>Saad?</em>
                </p>
              </div>
              <p className="sign__line">{PROFILE.signLine}</p>
              <p className="sign__ctrl">
                <span className="kbd-hint">← → move · SPACE jump</span>
                <span className="touch-hint">◀ ▶ move · Ⓐ jump</span>
                <br />
                hit the ? blocks →
              </p>
            </div>
            <div className="sign__post" />
          </div>

          {BUSHES.map((x) => (
            <div key={x} className="bush" style={{ left: x, top: GROUND - 22 }} aria-hidden="true" />
          ))}

          <div className="ground" style={{ width: WORLD_W, top: GROUND, height: 2 * T }} aria-hidden="true" />

          {level.solids.map((s) => {
            if (s.kind === 'ground' || s.kind === 'invisible') return null
            if (s.kind === 'pipe') {
              return (
                <div key={s.id} className="pipe" style={{ left: s.x, top: s.y, width: s.w, height: s.h }}>
                  {s.label && <span className="pipe__label">{s.label}</span>}
                </div>
              )
            }
            const isQ = s.kind === 'q'
            return (
              <div
                key={s.id}
                ref={isQ || s.kind === 'brick' ? setRef(blocks, s.id) : undefined}
                className={`block block--${s.kind} ${s.mini ? 'block--mini' : ''}`}
                style={{ left: s.x, top: s.y }}
                title={isQ ? BY_ID[s.id]?.title : undefined}
              >
                {isQ && <span>?</span>}
              </div>
            )
          })}

          <div className="impala" ref={impalaRef} style={{ left: level.impala.x, top: level.impala.y, width: level.impala.w, height: level.impala.h }}>
            <Impala />
            <span className="impala__honk">HONK!</span>
          </div>

          {level.coins.map((c) => (
            <div key={c.id} ref={setRef(coinEls, c.id)} className="coin" style={{ left: c.x, top: c.y }} aria-hidden="true" />
          ))}

          <div ref={pieRef} className="pie" style={{ left: level.pie.x, top: level.pie.y }} aria-hidden="true">
            🥧
          </div>
          <div className="cloud cloud--front" style={{ left: level.pie.x - 34, top: level.pie.y - 6 }} aria-hidden="true" />

          {level.bugs.map((b) => (
            <div key={b.id} ref={setRef(bugs, b.id)} className="bug" style={{ width: b.w, height: b.h }}>
              <span className="bug__label">{b.label}</span>
              <BugSprite />
            </div>
          ))}

          <div className="ball" ref={ballRef} aria-hidden="true">
            ⚽
          </div>
          <div className="bubble" ref={bubbleRef} aria-hidden="true">
            Football is life!
          </div>

          <div className="flagpole" style={{ left: FLAG_X, top: GROUND - 9 * T, height: 9 * T }} aria-hidden="true">
            <div className="flagpole__flag" ref={flagRef}>
              S
            </div>
          </div>
          <div className="castle" style={{ left: CASTLE_X, top: GROUND - 5 * T, width: 5 * T, height: 5 * T }} aria-hidden="true">
            <div className="castle__door" />
          </div>

          <div className="player" ref={playerRef} style={{ width: 22, height: 32 }} data-frame="idle" data-facing="r">
            <PlayerSprite suit={suit} />
          </div>
        </div>

        {/* HUD */}
        <div className="hud">
          <div className="hud__stat">
            <span>SAAD</span>
            <b>🪙×{String(coins).padStart(2, '0')}</b>
          </div>
          <div className="hud__stat hud__hide-sm">
            <span>WORLD</span>
            <b>1-1</b>
          </div>
          <div className="hud__stat">
            <span>MILESTONES</span>
            <b>
              {visited.size}/{MAIN_COUNT}
            </b>
          </div>
          <div className="hud__stat">
            <span>TIME</span>
            <b ref={timeRef}>0.0</b>
          </div>
          <div className="hud__btns">
            <button className="hud__btn" onClick={restart} title="Restart level" aria-label="Restart level">
              ↻
            </button>
            <button className="hud__btn hud__btn--wide" onClick={() => setListView(true)}>
              Skip level ☰
            </button>
          </div>
        </div>

        {card && <MilestoneCard m={card} onClose={() => setCard(null)} />}

        {ended && (
          <div className="endcard" role="dialog" aria-label="Level complete">
            <p className="endcard__kicker">COURSE CLEAR! {finish ? `· ${(finish / 1000).toFixed(1)}s` : ''}</p>
            <h2 className="endcard__title">Thank you for playing!</h2>
            <p>But your next hire is in another castle…</p>
            <div className="endcard__btns">
              <a className="btn btn--gold btn--sm" href="#contact">
                Enter the castle →
              </a>
              <a className="btn btn--white btn--sm" href="#projects">
                Keep exploring ↓
              </a>
              <button className="btn btn--teal btn--sm" onClick={restart}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch controls */}
      {!listView && (
        <div className="pad" aria-label="Game controls">
          <div className="pad__dpad">
            <button className="pad__btn" aria-label="Move left" {...pad('left')}>
              ◀
            </button>
            <button className="pad__btn" aria-label="Move right" {...pad('right')}>
              ▶
            </button>
          </div>
          <a className="pad__more" href="#projects" aria-label="Scroll down for more">
            <span aria-hidden="true">▼</span>
            scroll
          </a>
          <button className="pad__btn pad__btn--a" aria-label="Jump" {...pad('jump')}>
            A
          </button>
        </div>
      )}

      {listView && <ListView visited={visited} onBack={() => setListView(false)} />}
    </section>
  )
}

function MilestoneCard({ m, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [m])
  return (
    <div className="mcard__backdrop" onClick={onClose}>
      <article className="mcard" role="dialog" aria-modal="true" aria-label={m.title} onClick={(e) => e.stopPropagation()}>
        {m.picture && (
          <div className="mcard__pic">
            <Picture n={m.picture} alt={m.title} />
          </div>
        )}
        <div className="mcard__body">
          <p className="mcard__year">{m.year}</p>
          <h3 className="mcard__title">{m.title}</h3>
          <p className="mcard__org">{m.org}</p>
          <ul className="mcard__list">
            {m.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <button ref={closeRef} className="btn btn--sm mcard__btn" onClick={onClose}>
            Continue ▶
          </button>
        </div>
      </article>
    </div>
  )
}

function ListView({ visited, onBack }) {
  return (
    <div className="qlist wrap">
      <div className="qlist__head">
        <div>
          <p className="sec__kicker">WORLD 1-1 · LIST MODE</p>
          <h2 className="sec__title">
            The career, <em>no controller needed</em>
          </h2>
        </div>
        <button className="btn btn--gold" onClick={onBack}>
          ▶ Back to the game
        </button>
      </div>
      <ol className="qlist__items">
        {MILESTONES.map((m) => (
          <li key={m.id} className={`qlist__item card ${m.mini ? 'qlist__item--mini' : ''}`}>
            <span className={`qlist__block ${visited.has(m.id) ? 'is-used' : ''}`} aria-hidden="true">
              {visited.has(m.id) ? '' : '?'}
            </span>
            <div>
              <p className="mcard__year">{m.year}</p>
              <h3 className="qlist__title">{m.title}</h3>
              <p className="mcard__org">{m.org}</p>
              <ul className="mcard__list">
                {m.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
