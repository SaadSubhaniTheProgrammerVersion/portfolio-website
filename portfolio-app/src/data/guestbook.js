// The pixel guestbook. Grid size and limits must match api/_lib/guestbook-core.js.
export const GUESTBOOK = {
  cols: 32,
  rows: 20,
  maxPixels: 5,
  maxName: 24,
  // index = color id stored on the server, so only ever append to this list
  palette: ['#E01B7A', '#FFC42E', '#0FA3A3', '#5C94FC', '#C84C0C', '#2BB24C', '#1B0F16', '#FFFDF8', '#D98C7A', '#7A2E8C'],
  // Saad's gold coin in the top-left corner, so the wall is never empty. Not stored.
  seed: [
    '...GGG...',
    '.GGGGGGG.',
    '.GGIIIGG.',
    'GGIGGGGGG',
    'GGGIIIGGG',
    'GGGGGGIGG',
    '.GGIIIGG.',
    '.GGGGGGG.',
    '...GGG...',
  ],
  seedColors: { G: 1, I: 6 },
}
