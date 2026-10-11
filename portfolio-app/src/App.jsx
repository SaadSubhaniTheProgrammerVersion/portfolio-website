import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Boot from './components/Boot'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Toasts from './components/Toasts'
import CareerQuest from './sections/CareerQuest/CareerQuest'
import Projects from './sections/Projects/Projects'
import Skills from './sections/Skills/Skills'
import Mixtape from './sections/Mixtape/Mixtape'
import Beyond from './sections/Beyond/Beyond'
import Vault from './sections/Vault/Vault'
import Contact from './sections/Contact/Contact'
import { on, useStore } from './lib/store'
import { useSecrets, consoleEgg } from './lib/useSecrets'

const Terminal = lazy(() => import('./components/Terminal'))
const Pong = lazy(() => import('./components/Pong'))

// Opens a lazy-loaded modal whenever `event` is emitted.
function useModal(event) {
  const [open, setOpen] = useState(false)
  useEffect(() => on(event, () => setOpen((o) => (event === 'terminal' ? !o : true))), [event])
  const close = useCallback(() => setOpen(false), [])
  return [open, close]
}

export default function App() {
  const eightBit = useStore((s) => s.eightBit)
  const golden = useStore((s) => !!s.achievements.completionist)
  const [termOpen, closeTerm] = useModal('terminal')
  const [pongOpen, closePong] = useModal('pong')

  useSecrets()

  useEffect(() => {
    consoleEgg()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('eight-bit', eightBit)
  }, [eightBit])

  useEffect(() => {
    document.body.classList.toggle('golden', golden)
  }, [golden])

  return (
    <>
      <Boot />
      <Nav />
      <main>
        <CareerQuest />
        <Projects />
        <Skills />
        <Mixtape />
        <Beyond />
        <Vault />
        <Contact />
      </main>
      <Footer />
      <Toasts />
      <Suspense fallback={null}>
        {termOpen && <Terminal onClose={closeTerm} />}
        {pongOpen && <Pong onClose={closePong} />}
      </Suspense>
    </>
  )
}
