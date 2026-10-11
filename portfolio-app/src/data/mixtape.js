// Saad's artists. Every visit, the bucket draws 3 of them (always at least
// one `top` artist) and fills the crate with up to 3 random songs from each.
// Visitors only ever see the 3 that were drawn, never this full list.
//
// The ID is the part after "watch?v=" in a YouTube link. Every one here was
// checked to exist and to allow embedding.

export const ARTISTS = [
  {
    name: 'One Direction',
    top: true,
    color: '#E01B7A',
    songs: [
      ['What Makes You Beautiful', 'QJO3ROT-A4E'],
      ['Story of My Life', 'W-TE_Ys4iwM'],
      ['Drag Me Down', 'Jwgf3wmiA04'],
      ['Night Changes', 'syFZfO_wfMQ'],
      ['Best Song Ever', 'o_v9MY_FMcw'],
      ['Perfect', 'Ho32Oh6b4jc'],
    ],
  },
  {
    name: 'Niall Horan',
    top: true,
    color: '#2BB24C',
    songs: [
      ['Nice To Meet Ya', 'k7jeYJA9bgY'],
      ['Heaven', '4G9LwTTnn_k'],
      ['This Town', 'ic1l36GrNOU'],
      ['On The Loose', 'wk99OKNE_Ro'],
    ],
  },
  {
    name: 'Queen',
    top: true,
    color: '#FFC42E',
    songs: [
      ['Bohemian Rhapsody', 'fJ9rUzIMcZQ'],
      ["Don't Stop Me Now", 'HgzGwKwLmgM'],
      ['Under Pressure', 'a01QQZyl-_I'],
      ['Another One Bites the Dust', 'rY0WxgSXdEE'],
      ['Somebody To Love', 'kijpcUv-b8M'],
      ['We Will Rock You', '-tJYN-eG1zk'],
    ],
  },
  {
    name: 'Gracie Abrams',
    top: true,
    color: '#D98C7A',
    songs: [
      ["I Love You, I'm Sorry", 'uxjhN_Donfw'],
      ["That's So True", 'W_YOJWZIjxo'],
      ['Close To You', 'PmJuMNGp5YE'],
    ],
  },
  {
    name: 'Strings',
    color: '#0FA3A3',
    songs: [
      ['Duur', 'NgEQL8UOAG4'],
      ['Mera Bichraa Yaar', 'DZIUT1n0abw'],
      ['Najanay Kyun', 'BWKq4iXUnHs'],
      ['Ankhen', 'TXCT0HaPd_I'],
    ],
  },
  {
    name: 'Vital Signs',
    color: '#17802F',
    songs: [
      ['Dil Dil Pakistan', 'rMlKSqgNHNU'],
      ['Tum Mil Gaye', '4pXPiomaTxA'],
      ['Goray Rang Ka Zamana', 'VQZ30QGtkn0'],
    ],
  },
  {
    name: 'Atif Aslam',
    color: '#C84C0C',
    songs: [
      ['Tajdar-e-Haram', 'a18py61_F_w'],
      ['Pehli Nazar Mein', 'JBCx0QyP8VQ'],
      ['Woh Lamhe Woh Baatein', 'mX0_1yejIQI'],
    ],
  },
  {
    name: 'Harry Styles',
    color: '#5C94FC',
    songs: [
      ['As It Was', 'H5v3kku4y6Q'],
      ['Watermelon Sugar', 'E07s5ZYygMg'],
      ['Sign of the Times', 'qN4ooNx77u0'],
      ['Adore You', 'VF-r5TtlT9w'],
    ],
  },
  {
    name: 'Murtaza Qizilbash',
    color: '#7A2E8C',
    songs: [
      ['Hum', 'tvcaYU7uofY'],
      ['Tum', '0enmMyV1Q48'],
      ['Bhool', 'ZUQoFmTUw08'],
      ['Pyaar Mein', 'IyLSbYII_qk'],
      ['Maya (with Rafae Bokhari)', 'BymsI_6eMFI'],
    ],
  },
  {
    name: 'Blanks',
    color: '#AE1260',
    songs: [
      ["Let's Get Lost", 'yf2_uAtzWn8'],
      ['Breathe In Breathe Out', 'P0KFJONzzic'],
      ['Heart On Fire', 'CjsQNueO40g'],
      ['Sweaters', 'FgEvi2EOMAo'],
      ['Never Have I Ever', 'Jkl0PlDuKus'],
    ],
  },
  {
    name: 'Jonas Brothers',
    color: '#E8A010',
    songs: [
      ['Sucker', 'CnAmeh0-E-U'],
      ["Burnin' Up", '5KNEZJ6KkLI'],
      ['Only Human', 'kBNt8hYvn8A'],
      ['Lovebug', 'MKpCDz0UjW4'],
    ],
  },
  {
    name: 'Abdul Hannan',
    color: '#08797A',
    songs: [
      ['Bikhra (with Rovalio)', 'aRzbHxJZSTo'],
      ['Iraaday (with Rovalio)', 'Qwm6BSGrOq0'],
      ['Gawara', 'uESo-j31UX4'],
    ],
  },
  {
    name: 'Charlie Puth',
    color: '#2B2D6E',
    songs: [
      ['Attention', 'nfs8NYg7yQM'],
      ["We Don't Talk Anymore", '3AtDnEC4zak'],
      ['One Call Away', 'BxuY9FET9Y4'],
    ],
  },
  {
    name: 'Marshmello',
    color: '#1B0F16',
    songs: [
      ['Alone', 'ALZHF5UqnU4'],
      ['Happier', 'm7Bc3pLyij0'],
      ['FRIENDS', 'CY8E6N5Nzec'],
      ['Silence', 'Tx1sqYc3qas'],
    ],
  },
  {
    name: 'The 1975',
    color: '#5B4550',
    songs: [
      ['Somebody Else', 'Bimd2nZirT4'],
      ['Chocolate', 'CHk5SWVO4p8'],
      ['The Sound', 'FSnAllHtG70'],
    ],
  },
]

const SONGS_PER_ARTIST = 3

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Draw 3 artists (one guaranteed top artist), then up to 3 random songs each,
// shuffled together so the crate isn't grouped by artist.
export function drawBucket(previous = []) {
  const fresh = (a) => !previous.includes(a.name)
  const tops = ARTISTS.filter((a) => a.top)
  const top = shuffle(tops.filter(fresh).length ? tops.filter(fresh) : tops)[0]
  const rest = ARTISTS.filter((a) => a !== top)
  const others = shuffle(rest.filter(fresh).length >= 2 ? rest.filter(fresh) : rest).slice(0, 2)
  const artists = shuffle([top, ...others])
  const tracks = shuffle(
    artists.flatMap((a) =>
      shuffle(a.songs)
        .slice(0, SONGS_PER_ARTIST)
        .map(([title, youtubeId]) => ({ title, youtubeId, artist: a.name, color: a.color })),
    ),
  )
  return { artists, tracks }
}
