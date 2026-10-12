// Site-wide secret inputs: the Konami code, "suit up", the backtick
// terminal, and a little something for people who open DevTools.
import { useEffect } from 'react'
import { emit, foundEgg, getState, setState, unlock } from './store'
import { sfx } from './sound'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

export function useSecrets() {
  useEffect(() => {
    let codes = []
    let typed = ''
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return

      if (e.code === 'Backquote' && !getState().modal) {
        e.preventDefault()
        emit('terminal')
        return
      }

      codes = [...codes, e.code].slice(-KONAMI.length)
      if (codes.join() === KONAMI.join()) {
        codes = []
        const on = !getState().eightBit
        setState({ eightBit: on })
        sfx('flag')
        unlock('konami')
      }

      if (e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-12)
        if (typed.endsWith('suit up') || typed.endsWith('suitup')) {
          typed = ''
          setState({ suit: true })
          sfx('chime')
          foundEgg('suit-up')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function consoleEgg() {
  if (window.hireSaad) return
  console.log(
    "%cSAAD'S %cPLAYGROUND",
    'font: 900 34px Impact, sans-serif; color: #FFC42E; text-shadow: 3px 3px 0 #1B0F16; letter-spacing: 1px',
    'font: 900 34px Impact, sans-serif; color: #E01B7A; text-shadow: 3px 3px 0 #1B0F16',
  )
  console.log(
    '%cElementary, my dear developer. 🔍\n%cYou found the console. Type %chireSaad()%c to claim your achievement.\nVault hint: it was a really good year.',
    'font-size:14px;font-weight:bold;color:#0FA3A3',
    'font-size:12px',
    'font-size:12px;background:#FFC42E;color:#1B0F16;padding:2px 4px;border-radius:3px',
    'font-size:12px',
  )
  window.hireSaad = () => {
    unlock('devtools')
    return '🕵️ Dev Detective unlocked. Now go check the trophy shelf. (And seriously, email me.)'
  }
}
