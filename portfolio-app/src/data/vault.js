export const VAULT = {
  code: '2002',
  // Hints get a little less subtle the more wrong guesses pile up:
  // hints[0] at the start, then the next one every 2 wrong guesses.
  hints: [
    'Hint: the code is hiding in my gamer tag.',
    'Same tag I use on Steam. Ever played with me?',
    "It's a year. A really, really good year.",
    'A very good year for gamers. Think early 2000s.',
  ],
  // The first wrong answer always gets the goldfish line (Ted Lasso egg).
  wrong: [
    'Be a goldfish. 🐟 Try again.',
    "Nope. That's a 4-digit L.",
    'Idjits.',
    'Access denied. Have you tried turning it off and on again?',
    'Close! (It was not close.)',
    'The vault is judging you a little bit.',
  ],
  goofy: [16, 17, 18, 19, 20, 21],
}
