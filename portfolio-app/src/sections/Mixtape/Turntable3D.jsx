// The 3D turntable. Lazy-loaded, so three.js never slows down first paint.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const RECORD_Y = 0.36
const ARM_REST = 0.12
const ARM_PLAY = -0.42

// YouTube thumbnail → round record label (center-cropped from 16:9).
function useLabel(youtubeId) {
  const [loaded, setLoaded] = useState({ id: null, tex: null })
  useEffect(() => {
    if (!youtubeId) return
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
      (t) => {
        if (!alive) return t.dispose()
        t.colorSpace = THREE.SRGBColorSpace
        t.repeat.set(9 / 16, 1)
        t.offset.set((1 - 9 / 16) / 2, 0)
        setLoaded((old) => {
          old.tex?.dispose()
          return { id: youtubeId, tex: t }
        })
      },
      undefined,
      () => {}, // no thumbnail: the label just uses the record's color
    )
    return () => {
      alive = false
    }
  }, [youtubeId])
  return loaded.id === youtubeId ? loaded.tex : null
}

function Record({ track, playing }) {
  const group = useRef()
  const drop = useRef(1.6)
  const label = useLabel(track?.youtubeId)

  // a new record drops onto the platter
  useEffect(() => {
    drop.current = 1.6
  }, [track])

  const grooves = useMemo(() => [0.62, 0.78, 0.94, 1.1, 1.22], [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    drop.current = Math.max(0, drop.current - dt * 3.2)
    g.position.y = RECORD_Y + drop.current * drop.current
    g.rotation.y -= dt * (playing ? 3.49 : 0) // 33⅓ rpm
  })

  if (!track) return null
  return (
    <group ref={group} position={[-0.45, RECORD_Y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.03, 96]} />
        <meshStandardMaterial color="#121014" roughness={0.35} metalness={0.2} />
      </mesh>
      {grooves.map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 0]}>
          <ringGeometry args={[r, r + 0.012, 96]} />
          <meshBasicMaterial color="#2C2830" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.46, 64]} />
        {label ? <meshBasicMaterial map={label} toneMapped={false} /> : <meshStandardMaterial color={track.color} />}
      </mesh>
      {/* a little marker so you can see it spin */}
      <mesh position={[0.36, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.005, 0.08]} />
        <meshBasicMaterial color="#FFF4E4" />
      </mesh>
    </group>
  )
}

function Tonearm({ playing }) {
  const pivot = useRef()
  useFrame((_, dt) => {
    if (!pivot.current) return
    const target = playing ? ARM_PLAY : ARM_REST
    pivot.current.rotation.y += (target - pivot.current.rotation.y) * Math.min(1, dt * 3)
  })
  return (
    <group position={[1.35, 0.3, -1.05]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.16, 32]} />
        <meshStandardMaterial color="#D9DDE3" metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={pivot} rotation={[0, ARM_REST, 0]} position={[0, 0.16, 0]}>
        <mesh position={[0, 0, -0.32]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.24, 24]} />
          <meshStandardMaterial color="#1B0F16" />
        </mesh>
        <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.9, 12]} />
          <meshStandardMaterial color="#E8EAEE" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[-0.05, -0.04, 1.86]} rotation={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.16, 0.06, 0.3]} />
          <meshStandardMaterial color="#E01B7A" />
        </mesh>
      </group>
    </group>
  )
}

function Deck({ track, playing, coarse }) {
  const root = useRef()
  useFrame(({ clock }) => {
    // on touch screens there are no orbit controls, so sway gently instead
    if (coarse && root.current) root.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25
  })
  return (
    <group ref={root}>
      <RoundedBox args={[4.4, 0.5, 3.3]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#E01B7A" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0.255, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.1, 3]} />
        <meshStandardMaterial color="#AE1260" roughness={0.6} />
      </mesh>
      {/* platter */}
      <mesh position={[-0.45, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.38, 1.38, 0.1, 96]} />
        <meshStandardMaterial color="#C9CED6" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[-0.45, 0.42, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 12]} />
        <meshStandardMaterial color="#E8EAEE" metalness={0.8} />
      </mesh>
      <Record track={track} playing={playing} />
      <Tonearm playing={playing} />
      {/* knobs + power light */}
      {[
        [1.55, '#FFC42E'],
        [1.85, '#0FA3A3'],
      ].map(([x, c]) => (
        <mesh key={x} position={[x, 0.31, 1.25]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      <mesh position={[1.1, 0.27, 1.3]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={playing ? '#7CFF8A' : '#3A2A34'} />
      </mesh>
    </group>
  )
}

// Pull the camera back on tall/narrow canvases so the whole deck fits.
function CameraFit() {
  const { camera, size } = useThree()
  useEffect(() => {
    const k = Math.max(1, 1.5 / (size.width / size.height))
    camera.position.set(0, 4.4 * k, 5.2 * k)
    camera.lookAt(0, 0, 0)
  }, [camera, size.width, size.height])
  return null
}

export default function Turntable3D({ track, playing, active }) {
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 4.4, 5.2], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraFit />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#5C94FC" />
      <group position={[0, -0.4, 0]}>
        <Deck track={track} playing={playing} coarse={coarse} />
        <ContactShadows position={[0, -0.26, 0]} opacity={0.45} scale={9} blur={2.4} far={2} />
      </group>
      {!coarse && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.35}
          maxPolarAngle={1.2}
          minAzimuthAngle={-0.8}
          maxAzimuthAngle={0.8}
        />
      )}
    </Canvas>
  )
}
