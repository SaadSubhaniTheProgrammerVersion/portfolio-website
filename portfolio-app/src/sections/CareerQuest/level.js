// World 1-1 layout. Units are "game pixels": the world is WORLD_H tall and
// gets scaled to fit the screen. One tile = T.
import { MILESTONES } from '../../data/milestones'

export const T = 32
export const WORLD_H = 400
export const GROUND = WORLD_H - 2 * T // y of the ground's top edge
export const BLOCK_Y = GROUND - 4 * T // y of the ? blocks' top edge

export const PLAYER = { w: 22, h: 32, startX: 8 }

const STAIRS_X = 3600
const STAIRS = 6
export const FLAG_X = STAIRS_X + STAIRS * T + 3 * T
export const CASTLE_X = FLAG_X + 4 * T
export const WORLD_W = CASTLE_X + 7 * T

export function buildLevel() {
  const solids = [{ id: 'ground', kind: 'ground', x: -200, y: GROUND, w: WORLD_W + 400, h: 2 * T }]

  // ? blocks, one per milestone
  for (const m of MILESTONES) {
    solids.push({ id: m.id, kind: 'q', mini: !!m.mini, x: m.x, y: BLOCK_Y, w: T, h: T })
  }

  // decorative bricks that flank some ? blocks (they wiggle when bumped)
  const bricks = [544, 608, 1152, 1216, 2240, 2368, 2720, 2848, 3200, 3360]
  bricks.forEach((x, i) => solids.push({ id: `brick${i}`, kind: 'brick', x, y: BLOCK_Y, w: T, h: T }))

  // pipes
  const pipes = [
    { x: 760, h: 2, label: '' },
    { x: 1640, h: 3, label: '' },
    { x: 2560, h: 3, label: '' },
    { x: 3040, h: 2, label: '' },
  ]
  pipes.forEach((p, i) =>
    solids.push({ id: `pipe${i}`, kind: 'pipe', label: p.label, x: p.x, y: GROUND - p.h * T, w: 2 * T, h: p.h * T }),
  )

  // Baby (the Impala): a long low body plus a cabin roof you can land on
  const IMPALA_X = 2000
  const impala = { x: IMPALA_X, y: GROUND - 52, w: 132, h: 52 }
  solids.push({ id: 'impala-body', kind: 'invisible', x: IMPALA_X, y: GROUND - 30, w: 132, h: 30 })
  solids.push({ id: 'impala-roof', kind: 'invisible', x: IMPALA_X + 40, y: GROUND - 49, w: 58, h: 19 })

  // the staircase before the flag
  for (let c = 0; c < STAIRS; c++) {
    for (let r = 0; r <= c; r++) {
      solids.push({ id: `stair${c}-${r}`, kind: 'stair', x: STAIRS_X + c * T, y: GROUND - (r + 1) * T, w: T, h: T })
    }
  }

  // the pie hides in a cloud above the top step
  const pie = { x: STAIRS_X + (STAIRS - 1) * T + 4, y: GROUND - STAIRS * T - 104, w: 24, h: 20 }

  const bugs = [
    { x0: 1000, x1: 1130, label: 'P3' },
    { x0: 1260, x1: 1400, label: 'P2' },
    { x0: 1740, x1: 1960, label: 'P3' },
    { x0: 2400, x1: 2520, label: 'P2' },
    { x0: 2890, x1: 3000, label: 'P3' },
    { x0: 3380, x1: 3560, label: 'P2' },
  ].map((b, i) => ({ id: `bug${i}`, ...b, x: b.x0 + 10, y: GROUND - 20, w: 26, h: 20, vx: i % 2 ? 40 : -40 }))

  const coins = []
  const coinRow = (x, y, n) => {
    for (let i = 0; i < n; i++) coins.push({ id: `c${coins.length}`, x: x + i * 28, y, w: 16, h: 20 })
  }
  coinRow(700, GROUND - 120, 3)
  coinRow(1680, GROUND - 170, 3)
  coinRow(2026, GROUND - 120, 3) // above Baby's roof
  coinRow(2590, GROUND - 180, 2)
  coinRow(3080, GROUND - 140, 4)

  const ball = { x: 2140, y: GROUND - 20, r: 10 }

  return { solids, bugs, coins, ball, pie, impala, flagX: FLAG_X, castleX: CASTLE_X }
}
