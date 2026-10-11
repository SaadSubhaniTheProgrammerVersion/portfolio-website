// PONG, a tribute to the original that was written in MASM Assembly.
// First to 5. Mouse / touch / W-S / arrow keys move the left paddle.
import { useEffect, useRef, useState } from 'react'
import { getState, setState, unlock } from '../lib/store'
import { sfx } from '../lib/sound'
import './Pong.css'

const W = 800
const H = 500
const PW = 12
const PH = 80
const WIN = 5

export default function Pong({ onClose }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState([0, 0])
  const [result, setResult] = useState(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    setState({ modal: 'pong' })
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('keydown', esc)
      if (getState().modal === 'pong') setState({ modal: null })
    }
  }, [onClose])

  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const s = { p: H / 2 - PH / 2, a: H / 2 - PH / 2, bx: W / 2, by: H / 2, vx: 0, vy: 0, sc: [0, 0], wait: 1, over: false }
    const keys = {}

    const serve = (dir) => {
      s.bx = W / 2
      s.by = H / 2
      const ang = (Math.random() - 0.5) * 0.8
      s.vx = Math.cos(ang) * 340 * dir
      s.vy = Math.sin(ang) * 340
      s.wait = 0.8
    }
    serve(Math.random() < 0.5 ? 1 : -1)

    const toLocal = (clientY) => {
      const r = cv.getBoundingClientRect()
      return ((clientY - r.top) / r.height) * H
    }
    const move = (e) => {
      s.p = Math.max(0, Math.min(H - PH, toLocal(e.clientY) - PH / 2))
    }
    const kd = (e) => {
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault()
        keys[e.code] = true
      }
    }
    const ku = (e) => (keys[e.code] = false)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerdown', move)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    let last = performance.now()
    let raf
    const loop = (now) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 30))
      last = now

      if (!s.over) {
        const kdir = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0)
        s.p = Math.max(0, Math.min(H - PH, s.p + kdir * 420 * dt))

        // the AI: decent, beatable, slightly lazy
        const target = s.vx > 0 ? s.by - PH / 2 : H / 2 - PH / 2
        const d = target - s.a
        s.a += Math.sign(d) * Math.min(Math.abs(d), 300 * dt)

        if (s.wait > 0) s.wait -= dt
        else {
          s.bx += s.vx * dt
          s.by += s.vy * dt
          if (s.by < 6 || s.by > H - 6) {
            s.vy *= -1
            s.by = Math.max(6, Math.min(H - 6, s.by))
            sfx('click')
          }
          const hit = (py, px, dir) => {
            if (s.by > py - 6 && s.by < py + PH + 6) {
              const rel = (s.by - (py + PH / 2)) / (PH / 2)
              const speed = Math.min(Math.hypot(s.vx, s.vy) * 1.06, 780)
              s.vx = Math.cos(rel * 0.9) * speed * dir
              s.vy = Math.sin(rel * 0.9) * speed
              s.bx = px
              sfx('bump')
            }
          }
          if (s.vx < 0 && s.bx < 30 + PW && s.bx > 24) hit(s.p, 30 + PW + 6, 1)
          if (s.vx > 0 && s.bx > W - 30 - PW && s.bx < W - 24) hit(s.a, W - 30 - PW - 6, -1)

          if (s.bx < -10 || s.bx > W + 10) {
            const who = s.bx < 0 ? 1 : 0
            s.sc = [...s.sc]
            s.sc[who]++
            setScore(s.sc)
            sfx(who === 0 ? 'coin' : 'error')
            if (s.sc[who] >= WIN) {
              s.over = true
              setResult(who === 0 ? 'win' : 'lose')
              if (who === 0) unlock('pong')
            } else serve(who === 0 ? 1 : -1)
          }
        }
      }

      // draw
      ctx.fillStyle = '#0D0A0F'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#3A2A34'
      for (let y = 10; y < H; y += 30) ctx.fillRect(W / 2 - 3, y, 6, 16)
      ctx.fillStyle = '#FFC42E'
      ctx.fillRect(30, s.p, PW, PH)
      ctx.fillStyle = '#E01B7A'
      ctx.fillRect(W - 30 - PW, s.a, PW, PH)
      ctx.fillStyle = '#FFF4E4'
      if (!s.over) ctx.fillRect(s.bx - 6, s.by - 6, 12, 12)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerdown', move)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [round])

  const again = () => {
    setScore([0, 0])
    setResult(null)
    setRound((r) => r + 1)
  }

  return (
    <div className="pong__backdrop" onClick={onClose}>
      <div className="pong" role="dialog" aria-modal="true" aria-label="Pong" onClick={(e) => e.stopPropagation()}>
        <div className="pong__head">
          <span className="pong__score pong__score--you">YOU {score[0]}</span>
          <span className="pong__title">PONG.asm</span>
          <span className="pong__score pong__score--cpu">{score[1]} CPU</span>
          <button className="pong__x" onClick={onClose} aria-label="Close Pong">
            ✕
          </button>
        </div>
        <div className="pong__field">
          <canvas ref={canvasRef} width={W} height={H} />
          {result && (
            <div className="pong__over">
              <p className="pixel">{result === 'win' ? 'YOU WIN! 🏆' : 'CPU WINS'}</p>
              <p>{result === 'win' ? 'The Assembly gods are pleased.' : 'Be a goldfish. Try again.'}</p>
              <button className="btn btn--gold btn--sm" onClick={again}>
                Rematch
              </button>
            </div>
          )}
        </div>
        <p className="pong__help">Move with your mouse, finger, W/S or ↑/↓. First to {WIN}.</p>
      </div>
    </div>
  )
}
