// Drop Picture1.png, Picture2.jpg, … into src/assets/pictures and they are
// picked up here automatically. Any of png / jpg / jpeg / webp / gif works.
const files = import.meta.glob('../assets/pictures/Picture*.{png,jpg,jpeg,webp,gif,PNG,JPG,JPEG,WEBP}', {
  eager: true,
  import: 'default',
})

const byNumber = {}
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/Picture(\d+)\.\w+$/)
  if (m) byNumber[Number(m[1])] = url
}

export function pictureUrl(n) {
  return byNumber[n] || null
}
