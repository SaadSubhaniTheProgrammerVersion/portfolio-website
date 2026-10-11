// One tiny global store, readable from React (useStore) and from plain code
// like the game loop (getState). Progress is saved in localStorage.
import { useSyncExternalStore } from 'react'
import { ACHIEVEMENTS, FANDOMS, EGG_LINES } from '../data/eggs'
import { sfx } from './sound'

const KEY = 'saad.exe.v1'
const SAVED = ['achievements', 'eggs', 'coins', 'muted', 'suit', 'eightBit', 'terminalSeen', 'guestbookDone']

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

let state = {
  achievements: {},
  eggs: {},
  coins: 0,
  muted: false,
  suit: false,
  eightBit: false,
  toasts: [],
  modal: null,
  terminalSeen: false,
  guestbookDone: false,
  ...load(),
}
const listeners = new Set()

function save() {
  try {
    const out = {}
    for (const k of SAVED) out[k] = state[k]
    localStorage.setItem(KEY, JSON.stringify(out))
  } catch {
    // private mode or blocked storage: progress just won't persist
  }
}

export function getState() {
  return state
}

export function setState(patch) {
  state = { ...state, ...patch }
  save()
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state))
}

// ── toasts ───────────────────────────────────────────────
let toastId = 0
export function toast(t) {
  const item = { id: ++toastId, ms: 3800, ...t }
  setState({ toasts: [...state.toasts, item] })
}
export function dismissToast(id) {
  setState({ toasts: state.toasts.filter((t) => t.id !== id) })
}

// ── coins ────────────────────────────────────────────────
export function addCoins(n = 1) {
  setState({ coins: state.coins + n })
}

// ── achievements ─────────────────────────────────────────
export function unlock(id) {
  if (state.achievements[id]) return
  const a = ACHIEVEMENTS.find((x) => x.id === id)
  if (!a) return
  setState({ achievements: { ...state.achievements, [id]: Date.now() } })
  sfx('chime')
  if (id === 'completionist') toast({ kind: 'legendary', ms: 6500 })
  else toast({ kind: 'achievement', icon: a.icon, title: a.name, body: a.how })

  const others = ACHIEVEMENTS.filter((x) => x.id !== 'completionist')
  if (id !== 'completionist' && others.every((x) => state.achievements[x.id])) {
    setTimeout(() => unlock('completionist'), 1200)
  }
}

export function foundEgg(egg) {
  if (state.eggs[egg]) return
  setState({ eggs: { ...state.eggs, [egg]: true } })
  toast({ kind: 'egg', icon: '🥚', title: 'Easter egg', body: EGG_LINES[egg] || egg, ms: 2600 })
  for (const [ach, f] of Object.entries(FANDOMS)) {
    if (!f.eggs.includes(egg)) continue
    const found = f.eggs.filter((e) => state.eggs[e]).length
    if (found >= f.need) unlock(ach)
  }
}

// ── tiny event bus (terminal → game, etc.) ───────────────
const bus = new Map()
export function emit(type, payload) {
  bus.get(type)?.forEach((fn) => fn(payload))
}
export function on(type, fn) {
  if (!bus.has(type)) bus.set(type, new Set())
  bus.get(type).add(fn)
  return () => bus.get(type).delete(fn)
}
