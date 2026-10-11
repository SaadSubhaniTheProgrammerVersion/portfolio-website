// The World 1-1 game loop. Runs outside React: it reads input flags, steps
// the physics and writes transforms straight onto DOM nodes. React only
// hears about the rare, interesting events through callbacks.
import { PLAYER, WORLD_W, WORLD_H, GROUND, T, buildLevel } from './level'
import { sfx } from '../../lib/sound'

const GRAV = 2000
const JUMP_V = -740
const JUMP_CUT = -280
const RUN_MAX = 245
const ACCEL = 1700
const FRICTION = 1500
const MAX_FALL = 900
const COYOTE = 0.08
const JUMP_BUFFER = 0.12

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export class Engine {
  constructor(els, cb) {
    this.els = els
    this.cb = cb
    this.input = { left: false, right: false, jump: false }
    this.vp = { w: 800, h: 400, scale: 1 }
    this.running = false
    this.paused = false
    this.raf = 0
    this.tick = this.tick.bind(this)
    this.reset()
  }

  reset() {
    const lvl = buildLevel()
    this.solids = lvl.solids
    this.bugs = lvl.bugs.map((b) => ({ ...b, dead: false, fleeing: false, gone: false, t: 0 }))
    this.coins = lvl.coins.map((c) => ({ ...c, taken: false }))
    this.ball = { ...lvl.ball, vx: 0, vy: 0, angle: 0, kicked: false, cool: 0 }
    this.pie = { ...lvl.pie, taken: false }
    this.flagX = lvl.flagX
    this.castleX = lvl.castleX
    this.used = new Set()
    this.p = {
      x: PLAYER.startX, y: GROUND - PLAYER.h, w: PLAYER.w, h: PLAYER.h,
      vx: 0, vy: 0, onGround: true, facing: 1, invuln: 0, anim: 0,
      coyote: 0, buffer: 0, prevJump: false, onRoof: false,
    }
    this.phase = 'play'
    this.startTime = 0
    this.cam = 0
    this.flagY = 0
    this.stompCount = 0

    // reset DOM state
    const { els } = this
    els.blocks?.forEach((el) => el.classList.remove('used', 'bump'))
    els.bugs?.forEach((el) => el.classList.remove('dead', 'demon', 'gone'))
    els.coins?.forEach((el) => el.classList.remove('taken'))
    els.pie?.classList.remove('taken')
    els.player?.classList.remove('gone')
    els.ballBubble?.classList.remove('show')
    this.render()
  }

  setViewport(w, h) {
    this.vp = { w, h, scale: h / WORLD_H }
    this.render()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  tick(now) {
    if (!this.running) return
    // rAF timestamps can be slightly older than performance.now(), so never go negative
    const dt = Math.max(0, Math.min((now - this.last) / 1000, 1 / 30))
    this.last = now
    if (!this.paused) this.update(dt)
    this.render()
    this.raf = requestAnimationFrame(this.tick)
  }

  christo() {
    let n = 0
    for (const b of this.bugs) {
      if (b.dead || b.gone || b.fleeing) continue
      b.fleeing = true
      b.vx = (b.x < this.p.x ? -1 : 1) * 340
      this.els.bugs?.get(b.id)?.classList.add('demon')
      n++
    }
    return n
  }

  // ── physics ────────────────────────────────────────────
  update(dt) {
    const p = this.p
    const inp = this.input

    if (!this.startTime && (inp.left || inp.right || inp.jump)) {
      this.startTime = performance.now()
      this.cb.onStart?.()
    }

    if (this.phase === 'play') {
      // horizontal
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0)
      if (dir) {
        p.vx += dir * ACCEL * dt
        if (Math.sign(p.vx) !== dir) p.vx += dir * FRICTION * dt
        p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx))
        p.facing = dir
      } else {
        const f = FRICTION * dt
        p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f
      }

      // jump (with coyote time and a small input buffer)
      p.coyote = p.onGround ? COYOTE : p.coyote - dt
      if (inp.jump && !p.prevJump) p.buffer = JUMP_BUFFER
      else p.buffer -= dt
      if (p.buffer > 0 && p.coyote > 0) {
        p.vy = JUMP_V
        p.buffer = 0
        p.coyote = 0
        p.onGround = false
        sfx('jump')
      }
      if (!inp.jump && p.vy < JUMP_CUT) p.vy = JUMP_CUT
      p.prevJump = inp.jump
    }

    if (this.phase === 'play') this.movePlayer(dt)
    else this.updateEnding(dt)

    if (p.invuln > 0) p.invuln -= dt
    p.anim += dt * (Math.abs(p.vx) / 60 + 1)

    this.updateBugs(dt)
    this.updateBall(dt)
    if (this.phase === 'play') this.collect()

    // camera
    const visW = this.vp.w / this.vp.scale
    const target = Math.max(0, Math.min(WORLD_W - visW, p.x + p.w / 2 - visW * 0.4))
    this.cam += (target - this.cam) * Math.min(1, dt * 8)
  }

  movePlayer(dt) {
    const p = this.p
    p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt)

    p.x += p.vx * dt
    p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x))
    for (const s of this.solids) {
      if (!overlap(p, s)) continue
      if (p.vx > 0) p.x = s.x - p.w
      else if (p.vx < 0) p.x = s.x + s.w
      p.vx = 0
    }

    const wasOnRoof = p.onRoof
    p.y += p.vy * dt
    p.onGround = false
    p.onRoof = false
    let head = null
    let headOverlap = 0
    for (const s of this.solids) {
      if (!overlap(p, s)) continue
      if (p.vy > 0) {
        p.y = s.y - p.h
        p.vy = 0
        p.onGround = true
        if (s.id === 'impala-roof') p.onRoof = true
      } else if (p.vy < 0) {
        const ov = Math.min(p.x + p.w, s.x + s.w) - Math.max(p.x, s.x)
        if (ov > headOverlap) {
          head = s
          headOverlap = ov
        }
      }
    }
    if (head) {
      p.y = head.y + head.h
      p.vy = 0
      this.bump(head)
    }

    // safety net: if anything ever drops out of the world, put Saad back on the ground
    if (p.y > WORLD_H + 50) {
      p.y = GROUND - p.h - 40
      p.vy = 0
    }

    if (p.onRoof && !wasOnRoof) {
      sfx('honk')
      const el = this.els.impala
      if (el) {
        el.classList.remove('honk')
        void el.offsetWidth
        el.classList.add('honk')
      }
      this.cb.onEgg?.('impala')
    }

    if (p.x + p.w >= this.flagX) {
      this.phase = 'flag'
      p.x = this.flagX - p.w + 4
      p.vx = 0
      p.vy = 0
      p.facing = 1
      sfx('flag')
      this.cb.onFlag?.(this.startTime ? performance.now() - this.startTime : 0)
    }
  }

  bump(s) {
    if (s.kind !== 'q' && s.kind !== 'brick') return sfx('bump')
    const el = this.els.blocks?.get(s.id)
    if (el) {
      el.classList.remove('bump')
      void el.offsetWidth
      el.classList.add('bump')
    }
    sfx('bump')
    if (s.kind === 'q') {
      const first = !this.used.has(s.id)
      this.used.add(s.id)
      el?.classList.add('used')
      if (first) sfx('coin')
      this.cb.onBump?.(s.id, first)
    }
  }

  updateEnding(dt) {
    const p = this.p
    if (this.phase === 'flag') {
      p.y = Math.min(GROUND - p.h, p.y + 220 * dt)
      this.flagY = Math.min(GROUND - T * 2 - 40, this.flagY + 220 * dt)
      if (p.y >= GROUND - p.h) {
        this.phase = 'walk'
        p.x = this.flagX + 8
      }
    } else if (this.phase === 'walk') {
      p.vx = 120
      p.x += p.vx * dt
      if (p.x >= this.castleX + 3 * T - p.w / 2) {
        this.phase = 'done'
        p.vx = 0
        this.els.player?.classList.add('gone')
        this.cb.onEnd?.()
      }
    }
  }

  updateBugs(dt) {
    const p = this.p
    for (const b of this.bugs) {
      if (b.gone) continue
      if (b.dead) {
        b.t += dt
        if (b.t > 0.6) {
          b.gone = true
          this.els.bugs?.get(b.id)?.classList.add('gone')
        }
        continue
      }
      b.x += b.vx * dt
      if (b.fleeing) {
        if (b.x < -60 || b.x > WORLD_W + 60) {
          b.gone = true
          this.els.bugs?.get(b.id)?.classList.add('gone')
        }
        continue
      }
      if (b.x < b.x0) {
        b.x = b.x0
        b.vx = Math.abs(b.vx)
      } else if (b.x > b.x1) {
        b.x = b.x1
        b.vx = -Math.abs(b.vx)
      }

      if (this.phase !== 'play' || !overlap(p, b)) continue
      if (p.vy > 0 && p.y + p.h - b.y < 16) {
        b.dead = true
        p.vy = -460
        this.stompCount++
        this.els.bugs?.get(b.id)?.classList.add('dead')
        sfx('stomp')
        this.cb.onStomp?.(this.stompCount === this.bugs.length)
      } else if (p.invuln <= 0) {
        const away = p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1
        p.vx = away * 320
        p.vy = -320
        p.invuln = 1.2
        b.vx = -away * Math.abs(b.vx)
        sfx('hurt')
      }
    }
  }

  updateBall(dt) {
    const b = this.ball
    const p = this.p
    const box = () => ({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 })
    b.cool -= dt

    if (b.cool <= 0 && this.phase === 'play' && overlap(p, box())) {
      const dir = p.x + p.w / 2 < b.x ? 1 : -1
      b.vx = dir * 400 + p.vx * 0.4
      b.vy = -380
      b.cool = 0.3
      sfx('kick')
      if (!b.kicked) {
        b.kicked = true
        this.els.ballBubble?.classList.add('show')
        this.cb.onEgg?.('football')
      }
    }

    b.vy = Math.min(MAX_FALL, b.vy + GRAV * dt)
    b.x += b.vx * dt
    if (b.x < b.r || b.x > WORLD_W - b.r) {
      b.x = Math.max(b.r, Math.min(WORLD_W - b.r, b.x))
      b.vx = -b.vx * 0.6
    }
    for (const s of this.solids) {
      if (!overlap(box(), s)) continue
      b.x = b.vx > 0 ? s.x - b.r : s.x + s.w + b.r
      b.vx = -b.vx * 0.6
    }
    b.y += b.vy * dt
    let grounded = false
    for (const s of this.solids) {
      if (!overlap(box(), s)) continue
      if (b.vy > 0) {
        b.y = s.y - b.r
        b.vy = Math.abs(b.vy) < 90 ? 0 : -b.vy * 0.5
        grounded = true
      } else {
        b.y = s.y + s.h + b.r
        b.vy = -b.vy * 0.5
      }
    }
    if (b.y > WORLD_H + 50) Object.assign(b, { x: 2140, y: GROUND - 40, vx: 0, vy: 0 })
    if (grounded) b.vx *= Math.max(0, 1 - 2.2 * dt)
    if (Math.abs(b.vx) < 2) b.vx = 0
    b.angle += (b.vx * dt) / b.r
  }

  collect() {
    const p = this.p
    for (const c of this.coins) {
      if (c.taken || !overlap(p, c)) continue
      c.taken = true
      this.els.coins?.get(c.id)?.classList.add('taken')
      sfx('coin')
      this.cb.onCoin?.()
    }
    if (!this.pie.taken && overlap(p, this.pie)) {
      this.pie.taken = true
      this.els.pie?.classList.add('taken')
      sfx('coin')
      this.cb.onEgg?.('pie')
    }
  }

  // ── rendering ──────────────────────────────────────────
  render() {
    const { els, p, vp } = this
    const s = vp.scale
    if (els.world) els.world.style.transform = `translate3d(${(-this.cam * s).toFixed(2)}px,0,0) scale(${s})`
    if (els.parallax) els.parallax.style.transform = `translate3d(${(-this.cam * s * 0.35).toFixed(2)}px,0,0) scale(${s})`

    if (els.player) {
      els.player.style.transform = `translate3d(${p.x}px,${p.y}px,0)`
      let frame = 'idle'
      if (this.phase === 'flag') frame = 'jump'
      else if (!p.onGround && this.phase === 'play') frame = 'jump'
      else if (Math.abs(p.vx) > 10) frame = Math.floor(p.anim * 2.2) % 2 ? 'run1' : 'run2'
      els.player.dataset.frame = frame
      els.player.dataset.facing = p.facing > 0 ? 'r' : 'l'
      els.player.style.opacity = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 ? '0.35' : '1'
    }

    for (const b of this.bugs) {
      const el = els.bugs?.get(b.id)
      if (el && !b.gone) el.style.transform = `translate3d(${b.x}px,${b.y}px,0) scaleX(${b.vx > 0 ? -1 : 1})`
    }

    if (els.ball) {
      const b = this.ball
      els.ball.style.transform = `translate3d(${b.x - b.r}px,${b.y - b.r}px,0) rotate(${b.angle}rad)`
      if (els.ballBubble) els.ballBubble.style.transform = `translate3d(${b.x - 60}px,${b.y - 58}px,0)`
    }

    if (els.flag) els.flag.style.transform = `translateY(${this.flagY}px)`
  }
}
