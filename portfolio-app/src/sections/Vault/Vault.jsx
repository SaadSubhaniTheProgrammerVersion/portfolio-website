import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { VAULT } from '../../data/vault'
import { foundEgg, unlock, useStore } from '../../lib/store'
import { sfx } from '../../lib/sound'
import Picture from '../../components/Picture'
import './Vault.css'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⏎']

export default function Vault() {
  const cracked = useStore((s) => !!s.achievements.safecracker)
  const [code, setCode] = useState('')
  const [fails, setFails] = useState(0)
  const [msg, setMsg] = useState(VAULT.hint)
  const [shake, setShake] = useState(0)
  const [open, setOpen] = useState(false)
  const doorRef = useRef(null)

  // Already cracked on an earlier visit? Keep the door open.
  const isOpen = open || cracked

  const tryCode = (c) => {
    if (c === VAULT.code) {
      sfx('flag')
      setOpen(true)
      setMsg('ACCESS GRANTED. Welcome to the goof vault.')
      unlock('safecracker')
      const r = doorRef.current?.getBoundingClientRect()
      confetti({
        particleCount: 160,
        spread: 90,
        origin: r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight } : undefined,
        colors: ['#E01B7A', '#FFC42E', '#0FA3A3', '#5C94FC', '#FFF4E4'],
        disableForReducedMotion: true,
      })
      return
    }
    sfx('error')
    const n = fails + 1
    setFails(n)
    setShake((s) => s + 1)
    if (n === 1) foundEgg('goldfish')
    const line = VAULT.wrong[(n - 1) % VAULT.wrong.length]
    setMsg(n >= 3 ? `${line} ${VAULT.strongHint}` : line)
    setCode('')
  }

  const press = (k) => {
    if (isOpen) return
    sfx('click')
    if (k === 'C') return setCode('')
    if (k === '⏎') return code.length === 4 && tryCode(code)
    const next = (code + k).slice(0, 4)
    setCode(next)
    if (next.length === 4) setTimeout(() => tryCode(next), 180)
  }

  return (
    <section id="vault" className="sec vault">
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">RESTRICTED AREA</span>
          <h2 className="sec__title">
            The <em>vault</em>
          </h2>
          <p className="sec__lede">Classified goofy material. Four digits. The hint is right there, it's not exactly Fort Knox.</p>
        </div>

        <div className="vault__room">
          <Believe />
          <DevilsTrap />

          <div className="vault__safe">
            <div className={`safe ${isOpen ? 'is-open' : ''}`}>
              <div className="safe__inside">
                {VAULT.goofy.map((n, i) => (
                  <div key={n} className="goof" style={{ '--r': `${(i % 3) * 3 - 3}deg` }}>
                    <Picture n={n} alt="A goofy photo of Saad" emoji={['🤪', '😜', '🙃', '🤡', '😎', '🥸'][i % 6]} />
                  </div>
                ))}
              </div>
              <div className="safe__door" ref={doorRef}>
                <div className="safe__wheel" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="safe__brand">SAAD &amp; CO. SECURE</p>
              </div>
            </div>

            <div className="keypad" key={shake} data-shake={shake > 0 || undefined}>
              <div className="keypad__screen" aria-live="polite">
                {isOpen ? (
                  <span className="keypad__ok">OPEN</span>
                ) : (
                  [0, 1, 2, 3].map((i) => <span key={i}>{code[i] ? '●' : '_'}</span>)
                )}
              </div>
              <p className="keypad__msg">{isOpen && !open ? 'You already cracked it. Respect.' : msg}</p>
              <KeypadKeys onPress={press} disabled={isOpen} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function KeypadKeys({ onPress, disabled }) {
  // Let people type the code too, while the keypad is on screen.
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    const key = (e) => {
      if (!visible || disabled || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return
      if (/^\d$/.test(e.key)) onPress(e.key)
      else if (e.key === 'Backspace' || e.key === 'Escape') onPress('C')
      else if (e.key === 'Enter') onPress('⏎')
    }
    window.addEventListener('keydown', key)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', key)
    }
  }, [onPress, disabled])

  return (
    <div className="keypad__keys" ref={ref}>
      {KEYS.map((k) => (
        <button key={k} className={`key ${k === 'C' ? 'key--c' : ''} ${k === '⏎' ? 'key--go' : ''}`} onClick={() => onPress(k)} disabled={disabled}>
          {k}
        </button>
      ))}
    </div>
  )
}

// Ted Lasso: the BELIEVE sign. Crooked. Click to straighten. Keep clicking…
function Believe() {
  const [clicks, setClicks] = useState(0)
  const [torn, setTorn] = useState(false)
  const click = () => {
    if (torn) return
    sfx('click')
    const n = clicks + 1
    setClicks(n)
    if (n >= 4) {
      setTorn(true)
      sfx('slap')
      foundEgg('believe')
      setTimeout(() => {
        setTorn(false)
        setClicks(1)
      }, 2600)
    }
  }
  const state = torn ? 'torn' : clicks === 0 ? 'crooked' : 'straight'
  return (
    <button className={`believe believe--${state}`} onClick={click} aria-label="BELIEVE sign">
      <span className="believe__half believe__half--l">BELI</span>
      <span className="believe__half believe__half--r">EVE</span>
      <span className="believe__tape believe__tape--l" aria-hidden="true" />
      <span className="believe__tape believe__tape--r" aria-hidden="true" />
    </button>
  )
}

// Supernatural: a faint devil's trap on the vault floor.
function DevilsTrap() {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
    return `${100 + 70 * Math.cos(a)},${100 + 70 * Math.sin(a)}`
  }).join(' ')
  return (
    <svg className="trap" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="92" />
      <circle cx="100" cy="100" r="74" />
      <polygon points={pts} />
      <circle cx="100" cy="100" r="22" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return (
          <text key={i} x={100 + 83 * Math.cos(a)} y={100 + 83 * Math.sin(a) + 3} textAnchor="middle">
            {'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'[i]}
          </text>
        )
      })}
    </svg>
  )
}
