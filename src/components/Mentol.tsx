export type Mood = 'happy' | 'think' | 'wow' | 'cheer' | 'oops'

interface Props {
  mood?: Mood
  size?: number
  /** 0–1: how bright the rays are (grows with XP). */
  glow?: number
  bob?: boolean
  className?: string
}

const NAVY = '#023E86'
const YELLOW = '#F9C414'

/** Cik Mentol: the BSA bulb as a friendly mascot. */
export function Mentol({ mood = 'happy', size = 120, glow = 0.8, bob = false, className = '' }: Props) {
  const rays = [-75, -50, -25, 0, 25, 50, 75]
  return (
    <svg
      viewBox="0 0 120 150"
      width={size}
      height={(size * 150) / 120}
      className={`${bob ? 'anim-bob' : ''} ${className}`}
      role="img"
      aria-label="Cik Mentol"
    >
      <g stroke={YELLOW} strokeWidth="5" strokeLinecap="round" opacity={0.35 + 0.65 * glow} className="anim-glow">
        {rays.map((deg) => {
          const r1 = 44
          const r2 = deg === 0 ? 58 : 54
          const rad = ((deg - 90) * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={60 + r1 * Math.cos(rad)}
              y1={62 + r1 * Math.sin(rad)}
              x2={60 + r2 * Math.cos(rad)}
              y2={62 + r2 * Math.sin(rad)}
            />
          )
        })}
      </g>

      {/* bulb */}
      <circle cx="60" cy="66" r="34" fill={YELLOW} stroke={NAVY} strokeWidth="4" />
      <ellipse cx="48" cy="52" rx="7" ry="10" fill="#fff" opacity="0.55" transform="rotate(-25 48 52)" />

      {/* face */}
      <Face mood={mood} />

      {/* ring + base, like the logo */}
      <path d="M18 92 Q60 112 102 92" fill="none" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
      <rect x="38" y="100" width="44" height="12" rx="5" fill={NAVY} />
      <rect x="42" y="115" width="36" height="9" rx="4.5" fill={NAVY} />
      <path d="M48 127 h24 a12 12 0 0 1 -24 0z" fill={NAVY} />
    </svg>
  )
}

function Face({ mood }: { mood: Mood }) {
  const cheeks = (
    <g fill="#F28C28" opacity="0.35">
      <circle cx="40" cy="76" r="5" />
      <circle cx="80" cy="76" r="5" />
    </g>
  )
  switch (mood) {
    case 'cheer':
      return (
        <g stroke={NAVY} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M42 63 q5 -6 10 0" />
          <path d="M68 63 q5 -6 10 0" />
          <path d="M44 74 q16 18 32 0 z" fill={NAVY} />
          {cheeks}
        </g>
      )
    case 'wow':
      return (
        <g fill={NAVY}>
          <circle cx="47" cy="62" r="4.5" />
          <circle cx="73" cy="62" r="4.5" />
          <ellipse cx="60" cy="80" rx="6" ry="7.5" />
          {cheeks}
        </g>
      )
    case 'think':
      return (
        <g>
          <circle cx="49" cy="59" r="3.8" fill={NAVY} />
          <circle cx="75" cy="59" r="3.8" fill={NAVY} />
          <path d="M52 80 h14" stroke={NAVY} strokeWidth="3.5" strokeLinecap="round" />
          {cheeks}
        </g>
      )
    case 'oops':
      return (
        <g>
          <circle cx="47" cy="63" r="3.8" fill={NAVY} />
          <circle cx="73" cy="63" r="3.8" fill={NAVY} />
          <path d="M50 81 q5 -5 10 0 q5 5 10 0" stroke={NAVY} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {cheeks}
        </g>
      )
    default:
      return (
        <g>
          <circle cx="47" cy="62" r="4" fill={NAVY} />
          <circle cx="73" cy="62" r="4" fill={NAVY} />
          <path d="M47 75 q13 12 26 0" stroke={NAVY} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {cheeks}
        </g>
      )
  }
}
