import { pictureUrl } from '../lib/pictures'

const TINTS = ['var(--gold)', 'var(--teal)', 'var(--rose)', 'var(--sky)', 'var(--cream-2)']

// Shows PictureN if it exists, otherwise a colorful placeholder sticker.
export default function Picture({ n, alt = '', className = '', emoji = '📸', ...rest }) {
  const url = pictureUrl(n)
  if (url) {
    return <img src={url} alt={alt} className={`pic ${className}`} loading="lazy" decoding="async" {...rest} />
  }
  return (
    <div className={`pic pic--empty ${className}`} style={{ '--ph': TINTS[n % TINTS.length] }} role="img" aria-label={alt} {...rest}>
      <span aria-hidden="true">{emoji}</span>
      {import.meta.env.DEV && <small>drop Picture{n} here</small>}
    </div>
  )
}
