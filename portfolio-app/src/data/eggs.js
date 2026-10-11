// Achievements, and the fandom eggs that unlock three of them.
// `need` is how many of that show's eggs a visitor has to find.

export const ACHIEVEMENTS = [
  { id: 'safecracker', icon: '🔐', name: 'Safecracker', how: 'Cracked the vault.' },
  { id: 'konami', icon: '🎮', name: 'Konami Kid', how: 'Entered the code. You know the one.' },
  { id: 'squasher', icon: '🐛', name: 'Bug Squasher', how: 'Stomped every bug in World 1-1.' },
  { id: 'speedrun', icon: '⏱️', name: 'Speedrunner', how: 'Reached the flag in under 30 seconds.' },
  { id: 'audiophile', icon: '🎧', name: 'Audiophile', how: 'Spun 3 different records.' },
  { id: 'root', icon: '💻', name: 'Root Access', how: 'Opened the terminal.' },
  { id: 'pong', icon: '🏓', name: 'Pong Champ', how: 'Beat the Pong AI.' },
  { id: 'devtools', icon: '🕵️', name: 'Dev Detective', how: 'Found the secret in the browser console.' },
  { id: 'hunter', icon: '🚗', name: 'Hunter', how: 'Saving people, hunting things. The family business.' },
  { id: 'believer', icon: '🟨', name: 'Believer', how: 'Believed. Then believed some more.' },
  { id: 'legendary', icon: '☂️', name: 'Legendary', how: 'Found the yellow umbrella crowd.' },
  { id: 'completionist', icon: '👑', name: 'Completionist', how: 'Found every single thing. 100%.' },
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
