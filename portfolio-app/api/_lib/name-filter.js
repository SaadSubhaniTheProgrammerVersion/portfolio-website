// Keeps offensive names off the guestbook wall. Shared by the browser (instant
// feedback while typing) and the server (the check that actually counts).
//
// Tricks it sees through: leetspeak (f4ck, $h1t), stretched letters
// (fuuuck), and spaced or dotted letters (f u c k, f.u.c.k).
// To avoid blocking real names ("Hassan", "Dickson", "Scunthorpe"), short or
// ambiguous words only match as a whole word.

const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 6: 'g', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't', '€': 'e', '£': 'l' }

// Blocked wherever they appear, even inside other words or with spaces removed.
const ANYWHERE = [
  // English
  'motherf', 'bullshit', 'shithead', 'shitty', 'shitface', 'horseshit', 'bitch', 'whore', 'slut', 'bastard', 'nigger', 'nigga', 'faggot',
  'retard', 'rapist', 'porn', 'penis', 'vagina', 'dildo', 'blowjob', 'handjob', 'boob', 'pussy', 'wanker', 'twat',
  'asshole', 'dickhead', 'jackass', 'dumbass', 'hitler', 'kkk', 'nazism',
  // romanized Urdu / Hindi
  'madarchod', 'madrchod', 'maderchod', 'behenchod', 'bhenchod', 'benchod', 'bahenchod', 'bhosd', 'chutiy', 'chutia',
  'chootiy', 'gandu', 'gaandu', 'haramzad', 'haramkhor', 'harami', 'kanjar', 'lauda', 'lowda', 'randwa', 'tatti', 'kutti',
  'kamina', 'kameena', 'gashti', 'dalla',
]

// Blocked only as a whole word (on their own, they hide inside normal names).
const WHOLE_WORD = [
  'shit', 'cunt', 'cunts', 'ass', 'arse', 'dick', 'cock', 'cum', 'tit', 'tits', 'fag', 'rape', 'sex', 'nazi', 'kill', 'die', 'randi', 'lund',
  'loda', 'kutta', 'kuttay', 'bc', 'mc', 'mf', 'bsdk', 'gand', 'chod', 'damn', 'hell', 'piss', 'fuk', 'fak', 'fuq', 'fk', 'fku'
]

function normalize(s) {
  return [...s.toLowerCase().normalize('NFKD')]
    .map((ch) => LEET[ch] ?? ch)
    .join('')
    .replace(/[̀-ͯ]/g, '') // accents
}

// "fuck" -> /f+u+c+k+/ : survives stretched letters without merging real doubles.
const stretch = (w) => new RegExp([...w].map((ch) => `${ch}+`).join(''))
// f*ck with any vowel (or none): fuck, fack, f4ck, fck, phuck. Needs the "ck",
// so names like Fakhar / Afaq / Ishfaq stay allowed; short forms are whole-word below.
const FUCK_RE = /(f|ph)+[aeiou]*c+k+/
const ANY_RE = [...ANYWHERE.map(stretch), FUCK_RE]
const WORD_RE = WHOLE_WORD.map((w) => new RegExp(`^${[...w].map((ch) => `${ch}+`).join('')}$`))

export function isOffensiveName(raw) {
  if (!raw) return false
  const norm = normalize(String(raw))
  const squashed = norm.replace(/[^a-z]/g, '') // "f u c k" -> "fuck"
  if (ANY_RE.some((re) => re.test(squashed))) return true
  // whole words, plus the whole name squashed together ("b c" -> "bc")
  const words = [...norm.split(/[^a-z]+/).filter(Boolean), squashed]
  return words.some((w) => WORD_RE.some((re) => re.test(w)))
}
