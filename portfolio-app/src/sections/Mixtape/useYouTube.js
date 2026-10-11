// Loads the YouTube IFrame API once and drives a single player.
import { useCallback, useEffect, useRef, useState } from 'react'

let apiPromise
function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    document.head.appendChild(s)
  })
  return apiPromise
}

export function useYouTube({ onEnded, onError, onPlaying }) {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const cbs = useRef({ onEnded, onError, onPlaying })
  const [state, setState] = useState('idle') // idle | loading | playing | paused
  const [volume, setVolumeState] = useState(70)

  useEffect(() => {
    cbs.current = { onEnded, onError, onPlaying }
  })

  const load = useCallback(async (videoId) => {
    setState('loading')
    const YT = await loadApi()
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId)
      return
    }
    const mount = document.createElement('div')
    hostRef.current.replaceChildren(mount)
    playerRef.current = new YT.Player(mount, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e) => {
          e.target.setVolume(70)
          e.target.playVideo()
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            setState('playing')
            cbs.current.onPlaying?.()
          } else if (e.data === YT.PlayerState.PAUSED) setState('paused')
          else if (e.data === YT.PlayerState.ENDED) {
            setState('paused')
            cbs.current.onEnded?.()
          }
        },
        onError: (e) => {
          setState('paused')
          cbs.current.onError?.(e.data)
        },
      },
    })
  }, [])

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!p?.getPlayerState) return
    if (p.getPlayerState() === 1) p.pauseVideo()
    else p.playVideo()
  }, [])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    playerRef.current?.setVolume?.(v)
  }, [])

  useEffect(() => () => playerRef.current?.destroy?.(), [])

  return { hostRef, state, load, toggle, volume, setVolume }
}
