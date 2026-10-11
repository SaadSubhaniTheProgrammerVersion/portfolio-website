// Pixel art drawn from little text grids. One character = one pixel.
const PAL = {
  H: '#2A1A14', // hair
  S: '#C98B5E', // skin
  E: '#1B0F16', // eye
  T: '#E01B7A', // tee
  P: '#2B2D6E', // pants
  K: '#1B0F16', // shoes
  W: '#FFFDF8', // white
  R: '#D7263D', // tie
  U: '#26232E', // suit
}

const HEAD = [
  '...HHHHH....',
  '..HHHHHHH...',
  '..HHSSSSSS..',
  '..HSSSESSS..',
  '..HSSSESSS..',
  '...SSSSSSS..',
  '...SSSSSS...',
  '....SSSS....',
]

const FRAMES = {
  idle: [
    ...HEAD,
    '..TTTTTTT...',
    '.TTTTTTTTT..',
    '.TTSTTTTTT..',
    '.TTSTTTTTT..',
    '...PPPPP....',
    '...PP.PPP...',
    '...PP..PP...',
    '..KKK..KKK..',
  ],
  run1: [
    ...HEAD,
    '..TTTTTTT...',
    '.TTTTTTTTTS.',
    'STTTTTTTT...',
    '..TTTTTTT...',
    '...PPPPP....',
    '..PPP.PPP...',
    '.PP.....PP..',
    'KK.......KK.',
  ],
  run2: [
    ...HEAD,
    '..TTTTTTT...',
    '..TTTTTTT...',
    '..TTSTTTT...',
    '..TTSTTTT...',
    '...PPPPP....',
    '....PPP.....',
    '....PP......',
    '...KKKK.....',
  ],
  jump: [
    ...HEAD,
    '..TTTTTTTS..',
    '.TTTTTTTTS..',
    'STTTTTTTT...',
    '..TTTTTTT...',
    '...PPPPP....',
    '..PPP.PPP...',
    '.PP....PP...',
    '.KK.....KK..',
  ],
}

// Suit up: tee becomes a dark suit with a white shirt and a red tie.
function suitUp(grid) {
  return grid.map((row, y) => {
    if (y < 8 || y > 11) return row
    return [...row]
      .map((c, x) => {
        if (c !== 'T') return c
        if (x === 6) return 'R'
        if (x === 5 || x === 7) return y === 8 ? 'W' : 'U'
        return 'U'
      })
      .join('')
  })
}

function Grid({ grid, className }) {
  const rects = []
  grid.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={PAL[c]} />)
    }),
  )
  return (
    <svg className={className} viewBox="0 0 12 16" shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  )
}

export function PlayerSprite({ suit }) {
  return (
    <div className="hero-sprite">
      {Object.entries(FRAMES).map(([name, grid]) => (
        <Grid key={name} grid={suit ? suitUp(grid) : grid} className={`frame frame--${name}`} />
      ))}
    </div>
  )
}

const BUG = [
  '...E....E.....',
  '....E..E......',
  '..BBBBBBBB....',
  '.BBWWBBWWBB...',
  'BBBWEBBWEBBB..',
  'BBBBBBBBBBBB..',
  'BRRBBRRBBRRB..',
  '.BBBBBBBBBB...',
  '.L.L.L.L.L....',
  'L.L.L.L.L.L...',
]

export function BugSprite() {
  const pal = { B: '#7A2E8C', W: '#FFFDF8', E: '#1B0F16', R: '#B4479C', L: '#1B0F16' }
  return (
    <svg className="bug-sprite" viewBox="0 0 14 10" shapeRendering="crispEdges" aria-hidden="true">
      {BUG.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1.02"
              height="1.02"
              fill={pal[c]}
              className={c === 'W' ? 'bug-eye' : undefined}
            />
          ),
        ),
      )}
    </svg>
  )
}

// '67 Chevy Impala. Black, chrome, and a KAZ 2Y5 plate.
export function Impala() {
  return (
    <svg viewBox="0 0 132 52" aria-hidden="true">
      <path d="M36 22 L46 4 L92 4 L102 22 Z" fill="#141217" stroke="#000" strokeWidth="1.5" />
      <path d="M50 8 L58 8 L58 20 L42 20 Z M62 8 L88 8 L96 20 L62 20 Z" fill="#7FB3D8" opacity=".85" />
      <rect x="2" y="20" width="128" height="20" rx="5" fill="#141217" stroke="#000" strokeWidth="1.5" />
      <rect x="2" y="27" width="128" height="2" fill="#C9CED6" />
      <rect x="0" y="35" width="10" height="4" rx="1" fill="#C9CED6" />
      <rect x="122" y="35" width="10" height="4" rx="1" fill="#C9CED6" />
      <rect className="tail" x="1" y="22" width="4" height="5" fill="#8B1A1A" />
      <rect x="127" y="22" width="4" height="5" fill="#FFF3B0" />
      <rect x="14" y="33" width="22" height="6" rx="1" fill="#F2EEE3" stroke="#000" strokeWidth=".8" />
      <text x="25" y="38" fontSize="4.6" textAnchor="middle" fontFamily="monospace" fontWeight="700" fill="#1B0F16">
        KAZ 2Y5
      </text>
      <circle cx="30" cy="42" r="9" fill="#0D0C10" />
      <circle cx="30" cy="42" r="4" fill="#C9CED6" />
      <circle cx="102" cy="42" r="9" fill="#0D0C10" />
      <circle cx="102" cy="42" r="4" fill="#C9CED6" />
    </svg>
  )
}
