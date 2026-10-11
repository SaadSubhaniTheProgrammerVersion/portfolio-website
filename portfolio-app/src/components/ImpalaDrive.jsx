import { useEffect, useRef, useState } from 'react'
import { Impala } from '../sections/CareerQuest/sprites'
import { unlock } from '../lib/store'
import { sfx } from '../lib/sound'
import './ImpalaDrive.css'

const CAR_W = 96
const DEAN_GIF = 'https://media.giphy.com/media/qECS7IBgg7uLu/200w.gif'

// Baby sits at the start of the footer strip. Drag her to the end of the
// road and Dean shows up with a thumbs up.
export default function ImpalaDrive() {
  const trackRef = useRef(null)
  const drag = useRef(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [dean, setDean] = useState(false)

  const maxX = () => (trackRef.current ? trackRef.current.clientWidth - CAR_W - 8 : 0)

  const moveTo = (nx) => {
    const end = maxX()
    const clamped = Math.max(0, Math.min(end, nx))
    setX(clamped)
    if (clamped >= end - 2 && !arrived) {
      setArrived(true)
      setDean(true)
      sfx('honk')
      unlock('roadtrip')
    }
  }

  // Dean only sticks around for a bit.
  useEffect(() => {
    if (!dean) return
    const t = setTimeout(() => setDean(false), 7000)
    return () => clearTimeout(t)
  }, [dean])

  // Keep her parked at the end if the window is resized.
  useEffect(() => {
    if (!arrived) return
    const onResize = () => setX(maxX())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [arrived])

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, x0: x }
    setDragging(true)
  }
  const onPointerMove = (e) => {
    if (drag.current) moveTo(drag.current.x0 + e.clientX - drag.current.sx)
  }
  const onPointerUp = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      moveTo(x + (e.key === 'ArrowRight' ? 60 : -60))
    }
  }

  return (
    <div className={`drive ${dragging ? 'is-driving' : ''}`} ref={trackRef}>
      <button
        className={`drive__car ${dragging ? 'is-dragging' : ''} ${arrived ? 'has-arrived' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        aria-label="Baby, the '67 Impala. Drag her (or use the arrow keys) to the end of the road."
      >
        <Impala />
        {x === 0 && !arrived && <span className="drive__hint">drag me →</span>}
      </button>

      {dean && (
        <div className="drive__dean" role="status">
          <img src={DEAN_GIF} alt="Dean Winchester giving a thumbs up" width="160" height="120" />
          <span>Nice driving.</span>
        </div>
      )}
    </div>
  )
}
