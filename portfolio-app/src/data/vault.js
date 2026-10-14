export const VAULT = {
  // Hints get a little less subtle the more wrong guesses pile up:
  // hints[0] at the start, then the next one every 2 wrong guesses.
  hints: [
    'Hint: the code is hiding in my gamer tag.',
    'Same tag I use on Steam. Ever played with me?',
    "It's a year. A really, really good year.",
    'And the World Cup winner that year? Brazil. 🏆',
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
  // The goof files. Each card flips to show its story.
  files: [
    {
      picture: 16,
      title: 'Baby Saad',
      place: 'Where it all began',
      story: 'Exhibit A: baby Saad. What a sassy lil child I was.',
    },
    {
      picture: 17,
      title: 'The Last Hike',
      place: 'Rama Meadows → Rama Lake, Astore, Gilgit-Baltistan',
      story:
        'The last hike with the boys before the great separation. After this everybody graduated and went their own ways: some for marriage, some for jobs and some for masters.',
    },
    {
      picture: 18,
      title: 'The Safari Train',
      place: 'Rawalpindi → Attock, and back',
      story:
        "One random day we realized none of us had ever been on a train, except one fella. So we booked the weekend safari train and just went, with a stop at the beach on the way. It's oddly satisfying to stick your head out of a moving train. Not good for the hair though, I must say.",
    },
    {
      picture: 19,
      title: 'Doraemon, Live',
      place: 'SEECS Got Talent',
      story:
        'Got dared to perform the Doraemon theme song, so I walked on stage and did it in front of around 100 people, along with some other dumb songs. Was that talent? Maybe, maybe not. Do I regret it? Naaah.',
    },
    {
      picture: 20,
      title: 'That SRK Pose',
      place: 'Neelum Valley, near the Line of Control',
      story:
        'Woke everyone up in Neelum Valley, right by the Line of Control between Pakistan and India, with a war siren alarm. After giving everybody trauma, we hiked to the highest point we could see and took some photos with silly poses. Silly, but iconic.',
    },
    {
      picture: 21,
      title: '3 Sheikhs in Trouble',
      place: 'Desert safari · first trip abroad',
      story:
        "My first international trip with the boys. I've always been fascinated by deserts, so I spent over a week convincing these two to go on a desert safari. We ended up with this picture, which I call 3 Sheikhs in Trouble.",
    },
  ],
}
