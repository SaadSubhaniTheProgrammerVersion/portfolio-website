import { useEffect, useRef, useState } from 'react'
import { MILESTONES } from '../data/milestones'
import { PROJECTS } from '../data/projects'
import { PROFILE } from '../data/profile'
import { ACHIEVEMENTS } from '../data/eggs'
import { emit, foundEgg, getState, setState, unlock } from '../lib/store'
import { sfx } from '../lib/sound'
import './Terminal.css'

// BBC Sherlock, "The game, Mrs Hudson, is on!" (official Sherlock GIPHY upload)
const SHERLOCK_GIF = 'https://media.giphy.com/media/3o7TKVSE5isogWqnwk/200w.gif'

// Extra, more specific clues that follow a trophy's main hint.
const CLUES = {
  safecracker: ['The vault code? Check what I go by when I game.'],
  konami: ['↑ ↑ ↓ ↓ ← → ← → … and two letters. Anywhere on the page.'],
  squasher: ['Jump on them. From above. Every single one.'],
  speedrun: ['Skip the ? blocks and just run. The ↻ button restarts the clock.'],
  devtools: ['F12 (or right-click → Inspect), then open the Console tab.'],
  hunter: [
    'Baby is parked in World 1-1. Have you tried standing on her roof?',
    "Something sweet is hiding above the clouds, right before the flag. Dean's favourite.",
    "Demons hate one word. Try it in here: 'christo'.",
  ],
  believer: [
    'The BELIEVE sign by the vault looks a bit crooked. Fix it. Then keep going.',
    "There's a football in World 1-1. Give it a kick.",
    "Got a problem? Ask the diamond dogs. (In here.)",
  ],
  legendary: [
    'Ever looked closely at the record crate? Something yellow is tucked in there.',
    'Something blue and brassy is hiding near the polaroids.',
    'Type "suit up" anywhere. Seriously, anywhere.',
  ],
}

// Hints for the trophies this visitor hasn't unlocked yet: each one's main
// hint first, then its extra clues, taking turns across trophies.
function lockedHints() {
  const got = getState().achievements
  const locked = ACHIEVEMENTS.filter((a) => !got[a.id] && a.id !== 'completionist')
  const lists = locked.map((a) => [a.hint, ...(CLUES[a.id] || [])])
  const out = []
  for (let i = 0; lists.some((l) => l[i]); i++) lists.forEach((l) => l[i] && out.push(l[i]))
  return out
}

const go = (hash) => {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}

// Hidden guestbook admin commands (not in `help`). The password is checked
// by the server against GUESTBOOK_ADMIN_KEY; nothing secret lives in this file.
const ADMIN = {
  'sudo clear-wall': { params: 'all=1', label: 'wiping the whole guestbook wall' },
  'sudo erase-last': { params: 'last=1', label: 'erasing the latest signature' },
}

function run(raw, ctx) {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (ADMIN[cmd]) return ctx.admin(ADMIN[cmd])
  if (cmd.startsWith('sudo erase ')) {
    const name = raw.trim().replace(/^sudo\s+erase\s+/i, '')
    return ctx.admin({ params: `name=${encodeURIComponent(name)}`, label: `erasing everything signed "${name}"` })
  }
  switch (cmd) {
    case '':
      return []
    case 'help':
      return [
        'available commands:',
        '  whoami          who is this guy',
        '  ls projects     list the cartridges',
        '  cat resume      read the journal',
        '  sudo hire saad  you know you want to',
        '  play pong       rematch the Assembly classic',
        '  hint            get a nudge toward a secret',
        '  clear / exit',
        '  …and a few more that aren’t listed. 👀',
      ]
    case 'whoami':
      return [`${PROFILE.name.toLowerCase()} · ${PROFILE.role.toLowerCase()}`, 'distributed systems · payment engines · enterprise IAM · applied AI', `${PROFILE.location.toLowerCase()} · NUST CS '24`]
    case 'ls':
    case 'ls projects':
      return PROJECTS.map((p) => `  ${p.id.padEnd(12)} ${p.title}`)
    case 'ls -la':
    case 'ls -a':
      return ['  .', '  ..', '  .pie            # above the clouds', '  .impala         # parked in world 1-1', '  .umbrella       # yellow, obviously', '  projects/', '  resume.pdf']
    case 'cat resume':
    case 'cat resume.pdf':
      return [
        "══════════ SAAD'S JOURNAL ══════════",
        ...MILESTONES.filter((m) => !m.mini).map((m) => `  ${m.year.padEnd(9)} ${m.title} · ${m.org}`),
        '════════════════════════════════════',
        `  full pdf → ${PROFILE.resume}`,
      ]
    case 'sudo hire saad':
    case 'sudo hire-saad':
      setTimeout(() => {
        ctx.close()
        go('#contact')
      }, 1400)
      return ['[sudo] password for recruiter: ********', 'permission granted. opening the castle gates… 🏰']
    case 'hire saad':
      return ['permission denied. (try sudo)']
    case 'play pong':
    case 'pong':
      setTimeout(() => {
        ctx.close()
        emit('pong')
      }, 400)
      return ['inserting coin… 🪙']
    case 'hint': {
      const hints = lockedHints()
      if (!hints.length) return ["💡 nothing left to find. you're legendary. 👑"]
      return [`💡 ${hints[ctx.nextHint() % hints.length]}`]
    }
    case 'christo':
      emit('christo')
      foundEgg('christo')
      return ['christo.', 'somewhere in world 1-1, every bug just flinched. 👁️👁️']
    case 'diamond dogs':
      foundEgg('diamond-dogs')
      setTimeout(() => ctx.print(['barbecue sauce.']), 900)
      return ['woof.']
    case 'suit up':
      setState({ suit: true })
      foundEgg('suit-up')
      return ['suit up! 👔 your character is now dressed for success.']
    case 'suit down':
      setState({ suit: false })
      return ['back to casual friday.']
    case 'slap bet': {
      const n = ctx.slap()
      sfx('slap')
      return n <= 5 ? [`👋 SLAP! (${n} of 5 used)`] : ['the slap bet is over. …or is it?']
    }
    case 'vault':
    case 'vault code':
      return ["nice try, idjit. i'd check my steam profile if i were you."]
    case 'konami':
      return ['not here. use your arrow keys. 🎮']
    case 'rm -rf /':
    case 'sudo rm -rf /':
      return ['nice try. 😅 this portfolio has backups.']
    case '221b':
    case 'sherlock':
    case 'sherlock holmes':
      return ['🔍 221B Baker Street. The game is afoot.']
    case 'chai':
    case 'coffee':
      return ['brewing… ☕ done. productivity +10.']
    case 'music':
    case 'play music':
      setTimeout(() => {
        ctx.close()
        go('#mixtape')
      }, 400)
      return ['dropping the needle… 🎵']
    case 'exit':
    case 'quit':
      ctx.close()
      return []
    default:
      return [`command not found: ${cmd}. try 'help'`]
  }
}

export default function Terminal({ onClose }) {
  const [lines, setLines] = useState(() => [
    { t: 'saadsubhani.exe terminal v1.0 · type "help"', k: 'sys' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [hpos, setHpos] = useState(-1)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const hintRef = useRef(0)
  const slapRef = useRef(0)

  // First visit to the terminal: Sherlock says hi.
  const [sherlock, setSherlock] = useState(() => !getState().terminalSeen)
  useEffect(() => {
    if (!sherlock) return
    setState({ terminalSeen: true })
    const t = setTimeout(() => setSherlock(false), 6000)
    return () => clearTimeout(t)
  }, [sherlock])

  useEffect(() => {
    unlock('root')
    setState({ modal: 'terminal' })
    inputRef.current?.focus()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('keydown', esc)
      if (getState().modal === 'terminal') setState({ modal: null })
    }
  }, [onClose])

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight)
  }, [lines])

  const print = (out) => setLines((l) => [...l, ...out.map((t) => ({ t }))])

  // Guestbook admin: the key is remembered for this tab only.
  const [pwPrompt, setPwPrompt] = useState(null)
  const runAdmin = async (action, key) => {
    try {
      const r = await fetch(`/api/guestbook?${action.params}`, { method: 'DELETE', headers: { 'x-admin-key': key } })
      const data = await r.json().catch(() => ({}))
      if (r.status === 401) {
        sessionStorage.removeItem('gb.admin')
        return print(['sudo: incorrect password'])
      }
      if (!r.ok) return print([`✗ ${data.error || 'that did not work'}`])
      sessionStorage.setItem('gb.admin', key)
      emit('guestbook:refresh')
      print([`✓ removed ${data.removed} signature${data.removed === 1 ? '' : 's'}${data.names?.length ? ` (${data.names.slice(0, 5).join(', ')}${data.names.length > 5 ? ', …' : ''})` : ''}`])
    } catch {
      print(['✗ could not reach the wall. try again in a bit.'])
    }
  }
  const admin = (action) => {
    const saved = sessionStorage.getItem('gb.admin')
    if (saved) runAdmin(action, saved)
    else setPwPrompt(action)
    return [`🧹 ${action.label}…`]
  }

  const submit = (e) => {
    e.preventDefault()
    const raw = input
    setInput('')
    setHpos(-1)
    if (pwPrompt) {
      const action = pwPrompt
      setPwPrompt(null)
      setLines((l) => [...l, { t: '[sudo] password for saad: ' + '•'.repeat(Math.min(raw.length, 12)), k: 'sys' }])
      if (raw) runAdmin(action, raw)
      return
    }
    if (raw.trim()) setHistory((h) => [raw, ...h].slice(0, 30))
    if (raw.trim().toLowerCase() === 'clear') return setLines([])
    sfx('click')
    const out = run(raw, {
      close: onClose,
      print,
      nextHint: () => hintRef.current++,
      slap: () => ++slapRef.current,
      admin,
    })
    setLines((l) => [...l, { t: raw, k: 'cmd' }, ...out.map((t) => ({ t }))])
  }

  const onKey = (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const p = Math.min(hpos + 1, history.length - 1)
      setHpos(p)
      setInput(history[p])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const p = hpos - 1
      setHpos(Math.max(-1, p))
      setInput(p < 0 ? '' : history[p])
    }
  }

  return (
    <div className="term__backdrop" onClick={onClose}>
      <div className="term" role="dialog" aria-modal="true" aria-label="Terminal" onClick={(e) => e.stopPropagation()}>
        {sherlock && (
          <div className="term__sherlock" role="status">
            <img src={SHERLOCK_GIF} alt="Sherlock: The game, Mrs Hudson, is on!" width="200" height="112" />
            <span>The game is on. 🔍</span>
          </div>
        )}
        <div className="term__bar">
          <span className="term__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>guest@saadsubhani.exe: ~</span>
          <button onClick={onClose} aria-label="Close terminal">
            ✕
          </button>
        </div>
        <div className="term__body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((l, i) => (
            <p key={i} className={`term__line term__line--${l.k || 'out'}`}>
              {l.k === 'cmd' && <span className="term__ps">guest@saadsubhani.exe:~$ </span>}
              {l.t}
            </p>
          ))}
          <form onSubmit={submit} className="term__form">
            <span className="term__ps">{pwPrompt ? '[sudo] password for saad: ' : 'guest@saadsubhani.exe:~$ '}</span>
            <input
              ref={inputRef}
              type={pwPrompt ? 'password' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label={pwPrompt ? 'Password' : 'Terminal command'}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
