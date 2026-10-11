// Achievements, and the fandom eggs that unlock three of them.
// `need` is how many of that show's eggs a visitor has to find.
// `hint` is shown on the trophy shelf while locked, and by the terminal's `hint` command.

export const ACHIEVEMENTS = [
  {
    id: 'safecracker', icon: '🔐', name: 'Safecracker', how: 'Cracked the vault.',
    hint: "There's a locked door on this page. Know me well enough and it opens.",
  },
  {
    id: 'konami', icon: '🎮', name: 'Konami Kid', how: 'Entered the code. You know the one.',
    hint: 'Old-school cheat codes still work here. Up, up, down, down…',
  },
  {
    id: 'squasher', icon: '🐛', name: 'Bug Squasher', how: 'Stomped every bug in World 1-1.',
    hint: "Those P2s and P3s in World 1-1 won't fix themselves.",
  },
  {
    id: 'speedrun', icon: '⏱️', name: 'Speedrunner', how: 'Reached the flag in under 30 seconds.',
    hint: 'The flag in World 1-1 is closer than it looks. Under 30 seconds?',
  },
  {
    id: 'audiophile', icon: '🎧', name: 'Audiophile', how: 'Spun 3 different records.',
    hint: 'The crate is full of records. One song is never enough.',
  },
  {
    id: 'root', icon: '💻', name: 'Root Access', how: 'Opened the terminal.',
    hint: 'Every dev knows the key just above Tab. Or check the very bottom of the page.',
  },
  {
    id: 'pong', icon: '🏓', name: 'Pong Champ', how: 'Beat the Pong AI.',
    hint: 'One of the project cartridges is actually playable. Beat the machine.',
  },
  {
    id: 'devtools', icon: '🕵️', name: 'Dev Detective', how: 'Found the secret in the browser console. Elementary.',
    hint: 'Inspect the page. Literally. The game is afoot.',
  },
  {
    id: 'hunter', icon: '🚗', name: 'Hunter', how: 'Saving people, hunting things. The family business.',
    hint: 'Saving people, hunting things. Two nods to a certain pair of brothers are hiding around here.',
  },
  {
    id: 'believer', icon: '🟨', name: 'Believer', how: 'Believed. Then believed some more.',
    hint: 'Believe. Two nods to a very optimistic football coach are hiding around here.',
  },
  {
    id: 'legendary', icon: '☂️', name: 'Legendary', how: 'Found the yellow umbrella crowd.',
    hint: "Suit up! Two nods to a legendary group of friends (and the bar they never left) are hiding around here.",
  },
  {
    id: 'roadtrip', icon: '🛣️', name: 'Driver Picks the Music', how: 'Drove Baby all the way down the road.',
    hint: "Baby's parked at the very bottom of the page. Take her for a drive.",
  },
  {
    id: 'guestbook', icon: '🎨', name: 'Left Your Mark', how: 'Pinned your pixels to the guestbook wall.',
    hint: 'There is a wall down there that wants exactly five of your pixels.',
  },
  {
    id: 'completionist', icon: '👑', name: 'Completionist', how: 'Found every single thing. 100%.',
    hint: 'Find everything else first.',
  },
]

export const FANDOMS = {
  hunter: { show: 'Supernatural', need: 2, eggs: ['impala', 'christo', 'pie'] },
  believer: { show: 'Ted Lasso', need: 2, eggs: ['believe', 'goldfish', 'diamond-dogs', 'football'] },
  legendary: { show: 'How I Met Your Mother', need: 2, eggs: ['umbrella', 'horn', 'suit-up'] },
}

export const EGG_LINES = {
  impala: 'Baby says hi. 🚗',
  christo: 'Christo. The bugs did not like that.',
  pie: 'Dean would be proud. 🥧',
  believe: 'BELIEVE. (Taped back together, as always.)',
  goldfish: 'Be a goldfish. 🐟',
  'diamond-dogs': 'Woof.',
  football: 'Football is life!',
  umbrella: 'The yellow umbrella. ☂️',
  horn: 'I stole a blue French horn for you. 📯',
  'suit-up': 'Suit up! 👔',
}
