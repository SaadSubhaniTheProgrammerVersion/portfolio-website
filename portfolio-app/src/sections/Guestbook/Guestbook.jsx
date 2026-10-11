import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { GUESTBOOK } from '../../data/guestbook'
import { setState, toast, unlock, useStore } from '../../lib/store'
import { sfx } from '../../lib/sound'
import './Guestbook.css'

const { cols: COLS, rows: ROWS, maxPixels: MAX, palette: PALETTE } = GUESTBOOK
const API = '/api/guestbook'

function ago(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
  for (const [unit, secs] of [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (s >= secs) {
      const n = Math.floor(s / secs)
      return `${n} ${unit}${n > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

// Replay every submission in order: later pixels paint over earlier ones.
function buildGrid(submissions) {
  const grid = new Map()
  GUESTBOOK.seed.forEach((row, y) =>
    [...row].forEach((ch, x) => ch !== '.' && grid.set(`${x},${y}`, { c: GUESTBOOK.seedColors[ch], name: 'Saad', at: 0, seed: true })),
  )
  for (const s of [...submissions].sort((a, b) => a.at - b.at)) {
    for (const [x, y, c] of s.pixels) grid.set(`${x},${y}`, { c, name: s.name, at: s.at })
  }
  return grid
}

export default function Guestbook() {
  const done = useStore((s) => !!s.guestbookDone)
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [submissions, setSubmissions] = useState(null) // null = loading
  const [failed, setFailed] = useState(false)
  const [color, setColor] = useState(0)
  const [pending, setPending] = useState([]) // [[x, y, c]]
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [inspect, setInspect] = useState(null) // { x, y } of the hovered / tapped cell
  const [size, setSize] = useState(640)

  const grid = useMemo(() => buildGrid(submissions || []), [submissions])
  const cell = Math.floor(size / COLS)

  // Load the wall only once the section gets close, to keep API calls down.
  const load = useCallback(async () => {
    try {
      const r = await fetch(API)
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error()
      setSubmissions((await r.json()).submissions)
      setFailed(false)
    } catch {
      setFailed(true)
      setSubmissions([])
    }
  }, [])
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        load()
        io.disconnect()
      }
    }, { rootMargin: '400px' })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [load])

  // Size the canvas to its container.
  useEffect(() => {
    const el = canvasRef.current.parentElement
    const ro = new ResizeObserver(() => setSize(el.clientWidth))
    ro.observe(el)
    setSize(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // Draw.
  useEffect(() => {
    const cv = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const w = cell * COLS
    const h = cell * ROWS
    cv.width = w * dpr
    cv.height = h * dpr
    cv.style.width = `${w}px`
    cv.style.height = `${h}px`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#FFFDF8'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(27, 15, 22, .07)'
    ctx.lineWidth = 1
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cell + 0.5, 0)
      ctx.lineTo(x * cell + 0.5, h)
      ctx.stroke()
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cell + 0.5)
      ctx.lineTo(w, y * cell + 0.5)
      ctx.stroke()
    }
    grid.forEach((v, k) => {
      const [x, y] = k.split(',').map(Number)
      ctx.fillStyle = PALETTE[v.c]
      ctx.fillRect(x * cell, y * cell, cell, cell)
    })
    for (const [x, y, c] of pending) {
      ctx.fillStyle = PALETTE[c]
      ctx.fillRect(x * cell, y * cell, cell, cell)
      ctx.strokeStyle = '#1B0F16'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 2])
      ctx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
      ctx.setLineDash([])
    }
    if (inspect) {
      ctx.strokeStyle = '#1B0F16'
      ctx.lineWidth = 2
      ctx.strokeRect(inspect.x * cell + 1, inspect.y * cell + 1, cell - 2, cell - 2)
    }
  }, [grid, pending, inspect, cell])

  const cellAt = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - r.left) / cell)
    const y = Math.floor((e.clientY - r.top) / cell)
    return x >= 0 && y >= 0 && x < COLS && y < ROWS ? { x, y } : null
  }

  const onPointerDown = (e) => {
    const p = cellAt(e)
    if (!p) return
    setInspect(p)
    if (done || failed || submissions === null) return
    setError('')
    const i = pending.findIndex(([x, y]) => x === p.x && y === p.y)
    if (i >= 0) {
      // tap again: recolor if the color changed, otherwise remove
      if (pending[i][2] !== color) setPending(pending.map((q, j) => (j === i ? [p.x, p.y, color] : q)))
      else setPending(pending.filter((_, j) => j !== i))
      sfx('click')
    } else if (pending.length < MAX) {
      setPending([...pending, [p.x, p.y, color]])
      sfx('click')
    } else {
      sfx('error')
      setError(`That's all ${MAX}. Tap one of yours to remove it.`)
    }
  }

  const submit = async () => {
    if (!pending.length || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixels: pending, name }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Try again?')
      setSubmissions(data.submissions)
      setPending([])
      setState({ guestbookDone: true })
      sfx('flag')
      unlock('guestbook')
      toast({ kind: 'egg', icon: '🎨', title: 'Guestbook', body: "You're on the wall. Thanks for stopping by!", ms: 3200 })
      const r2 = canvasRef.current.getBoundingClientRect()
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: (r2.left + r2.width / 2) / window.innerWidth, y: (r2.top + r2.height / 2) / window.innerHeight },
        colors: PALETTE.slice(0, 6),
        disableForReducedMotion: true,
      })
    } catch (err) {
      sfx('error')
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const info = inspect && (pending.some(([x, y]) => x === inspect.x && y === inspect.y) ? { mine: true } : grid.get(`${inspect.x},${inspect.y}`))
  const signers = useMemo(
    () => (submissions || []).filter((s) => s.name).sort((a, b) => b.at - a.at).slice(0, 30),
    [submissions],
  )

  return (
    <section id="guestbook" className="sec gb" ref={sectionRef}>
      <div className="wrap">
        <div className="sec__head">
          <span className="sec__kicker">GUESTBOOK</span>
          <h2 className="sec__title">
            Leave your <em>mark</em>
          </h2>
          <p className="sec__lede">You get {MAX} pixels. Use them wisely. Then sign it.</p>
        </div>

        <div className="gb__frame">
          <div className="gb__wall">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={(e) => e.pointerType === 'mouse' && setInspect(cellAt(e))}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setInspect(null)}
              aria-label="Shared pixel wall. Tap cells to place your pixels."
              role="img"
            />
            {submissions === null && <p className="gb__overlay pixel">LOADING THE WALL…</p>}
            {failed && <p className="gb__overlay">The wall is taking a nap. Try again later.</p>}
          </div>
          <p className="gb__info" aria-live="polite">
            {!info
              ? done
                ? 'Hover or tap a pixel to see who placed it.'
                : 'Pick a color, then tap the wall.'
              : info.mine
                ? 'Your pixel (not pinned yet).'
                : info.seed
                  ? 'Placed by Saad, the very first pixels.'
                  : `Placed by ${info.name || 'anonymous'} · ${ago(info.at)}`}
          </p>
        </div>

        {done ? (
          <p className="gb__done">✓ You're on the wall. Thanks for leaving your mark!</p>
        ) : (
          <div className="gb__controls">
            <div className="gb__palette" role="radiogroup" aria-label="Color">
              {PALETTE.map((c, i) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={color === i}
                  aria-label={`Color ${i + 1}`}
                  className={`gb__swatch ${color === i ? 'is-on' : ''}`}
                  style={{ '--c': c }}
                  onClick={() => setColor(i)}
                />
              ))}
            </div>
            <p className="gb__left pixel">
              {MAX - pending.length} / {MAX} LEFT
            </p>
            <label className="gb__name">
              <span className="sr-only">Your name (optional)</span>
              <input
                value={name}
                maxLength={GUESTBOOK.maxName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sign it (optional)"
                autoComplete="nickname"
              />
            </label>
            <button className="btn btn--sm" onClick={submit} disabled={!pending.length || busy || failed}>
              {busy ? 'Pinning…' : 'Pin it to the wall 📌'}
            </button>
            {error && <p className="gb__error">{error}</p>}
          </div>
        )}

        {signers.length > 0 && (
          <div className="gb__signed">
            <p className="gb__signed-label">SIGNED BY</p>
            <ul>
              {signers.map((s) => (
                <li key={s.id} className="chip">
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
