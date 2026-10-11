// 8-bit sound effects synthesized on the fly: no audio files to load.
import { getState } from './store'

let ctx

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    ctx = null
  }
}

function tone({ type = 'square', from, to = from, at = 0, dur = 0.1, vol = 0.06 }) {
  const t0 = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const SOUNDS = {
  coin: () => {
    tone({ from: 988, dur: 0.07 })
    tone({ from: 1319, at: 0.07, dur: 0.22 })
  },
  jump: () => tone({ from: 300, to: 620, dur: 0.16, vol: 0.04 }),
  bump: () => tone({ type: 'triangle', from: 180, to: 90, dur: 0.1, vol: 0.12 }),
  stomp: () => tone({ from: 520, to: 140, dur: 0.12, vol: 0.05 }),
  hurt: () => tone({ type: 'sawtooth', from: 400, to: 120, dur: 0.25, vol: 0.04 }),
  kick: () => tone({ type: 'triangle', from: 140, to: 60, dur: 0.12, vol: 0.15 }),
  honk: () => {
    tone({ type: 'sawtooth', from: 330, dur: 0.18, vol: 0.05 })
    tone({ type: 'sawtooth', from: 415, dur: 0.18, vol: 0.04 })
    tone({ type: 'sawtooth', from: 330, at: 0.24, dur: 0.3, vol: 0.05 })
    tone({ type: 'sawtooth', from: 415, at: 0.24, dur: 0.3, vol: 0.04 })
  },
  horn: () => {
    tone({ type: 'sawtooth', from: 174, to: 165, dur: 0.6, vol: 0.07 })
    tone({ type: 'square', from: 87, dur: 0.6, vol: 0.03 })
  },
  chime: () => [523, 659, 784, 1047].forEach((f, i) => tone({ from: f, at: i * 0.08, dur: 0.18, vol: 0.05 })),
  click: () => tone({ from: 1200, dur: 0.03, vol: 0.03 }),
  error: () => {
    tone({ from: 220, dur: 0.12, vol: 0.05 })
    tone({ from: 160, at: 0.13, dur: 0.2, vol: 0.05 })
  },
  flag: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone({ from: f, at: i * 0.09, dur: 0.16, vol: 0.05 })),
  slap: () => tone({ type: 'sawtooth', from: 2000, to: 200, dur: 0.08, vol: 0.08 }),
}

export function sfx(name) {
  if (getState().muted || !ctx || ctx.state !== 'running') return
  try {
    SOUNDS[name]?.()
  } catch {
    // never let a sound effect break the page
  }
}
