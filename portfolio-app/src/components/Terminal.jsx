import { useEffect, useRef, useState } from 'react'
import { MILESTONES } from '../data/milestones'
import { PROJECTS } from '../data/projects'
import { PROFILE } from '../data/profile'
import { emit, foundEgg, getState, setState, unlock } from '../lib/store'
import { sfx } from '../lib/sound'
import './Terminal.css'

const HINTS = [
  'Old-school cheat codes still work here. ↑↑↓↓…',
  'Baby is parked in World 1-1. Have you tried standing on her roof?',
  "Something sweet is hiding above the clouds, right before the flag. Dean's favourite.",
  'The BELIEVE sign looks a bit crooked. Maybe fix it. Then keep going.',
  'Ever looked closely at the record crate? Something yellow is tucked in there.',
  'Something blue and brassy is hiding near the polaroids.',
  'Type "suit up" anywhere. Seriously, anywhere.',
  'Developers: the browser console has something for you.',
  "The vault's hint is not a trick. It's a birth year.",
]

const go = (hash) => {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}

function run(raw, ctx) {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ')
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
    case 'hint':
      return [`💡 ${HINTS[ctx.nextHint()]}`]
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
      return ['nice try, idjit. the hint is my birth year.']
    case 'konami':
      return ['not here. use your arrow keys. 🎮']
    case 'rm -rf /':
    case 'sudo rm -rf /':
      return ['nice try. 😅 this portfolio has backups.']
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
    { t: 'saad.exe terminal v1.0 · type "help"', k: 'sys' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [hpos, setHpos] = useState(-1)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const hintRef = useRef(0)
  const slapRef = useRef(0)

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

  const submit = (e) => {
    e.preventDefault()
    const raw = input
    setInput('')
    setHpos(-1)
    if (raw.trim()) setHistory((h) => [raw, ...h].slice(0, 30))
    if (raw.trim().toLowerCase() === 'clear') return setLines([])
    sfx('click')
    const out = run(raw, {
      close: onClose,
      print,
      nextHint: () => hintRef.current++ % HINTS.length,
      slap: () => ++slapRef.current,
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
        <div className="term__bar">
          <span className="term__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>guest@saad.exe: ~</span>
          <button onClick={onClose} aria-label="Close terminal">
            ✕
          </button>
        </div>
        <div className="term__body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((l, i) => (
            <p key={i} className={`term__line term__line--${l.k || 'out'}`}>
              {l.k === 'cmd' && <span className="term__ps">guest@saad.exe:~$ </span>}
              {l.t}
            </p>
          ))}
          <form onSubmit={submit} className="term__form">
            <span className="term__ps">guest@saad.exe:~$&nbsp;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label="Terminal command"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
