import { useId } from 'react'

interface LogoProps {
  size?: number
  className?: string
}

/**
 * Circular monogram badge — MOKADMI / LAWYER arc text + MS serif lettermark.
 * Colors follow the site's gold/light palette on dark background.
 */
export default function Logo({ size = 160, className = '' }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const topId    = `${uid}-top`
  const bottomId = `${uid}-bottom`

  // Geometry
  const cx = 100, cy = 100

  // Text arc radius (slightly inset from the decorative rings)
  const arcR = 79

  // Arc endpoints on the horizontal midline
  const lx = cx - arcR  // 21
  const rx = cx + arcR  // 179

  // Top arc: clockwise (sweep=1) from left → right through top
  const topPath    = `M ${lx},${cy} A ${arcR},${arcR} 0 0,1 ${rx},${cy}`
  // Bottom arc: counter-clockwise (sweep=0) from left → right through bottom
  // sweep=0 makes the text baseline face inward at the bottom (text readable, extends toward center)
  const bottomPath = `M ${lx},${cy} A ${arcR},${arcR} 0 0,0 ${rx},${cy}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mokadmi · Avocat"
      className={className}
    >
      <defs>
        <path id={topId}    d={topPath}    fill="none" />
        <path id={bottomId} d={bottomPath} fill="none" />
      </defs>

      {/* ── Decorative rings ──────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={92} fill="none" stroke="#C9A96E" strokeWidth="0.6" opacity="0.40" />
      <circle cx={cx} cy={cy} r={87} fill="none" stroke="#C9A96E" strokeWidth="0.25" opacity="0.18" />

      {/* ── MOKADMI — top arc ─────────────────────────────────── */}
      <text
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize="9"
        letterSpacing="5"
        fontWeight="500"
        fill="#C9A96E"
      >
        <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
          MOKADMI
        </textPath>
      </text>

      {/* ── LAWYER — bottom arc ───────────────────────────────── */}
      <text
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize="9"
        letterSpacing="5"
        fontWeight="500"
        fill="#C9A96E"
      >
        <textPath href={`#${bottomId}`} startOffset="50%" textAnchor="middle">
          LAWYER
        </textPath>
      </text>

      {/* ── MS Monogram ───────────────────────────────────────── */}
      {/*
        The M is rendered in gold; the S in light, partially overlapping.
        textAnchor="middle" lets us precisely control the overlap:
          M centered at x=83 → right edge ≈ x=114
          S centered at x=117 → left edge  ≈ x=94
          Overlap zone: x=94–114 (≈20px) — mimics the classic interleaved monogram.
      */}

      {/* M — gold, background layer */}
      <text
        x="83" y="122"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="82"
        fill="#C9A96E"
        opacity="0.88"
      >
        M
      </text>

      {/* S — light, overlapping foreground */}
      <text
        x="117" y="122"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="82"
        fill="#E8EDF5"
        opacity="0.80"
      >
        S
      </text>

      {/* S — subtle gold tint so it blends with the M at the overlap */}
      <text
        x="117" y="122"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="82"
        fill="#C9A96E"
        opacity="0.12"
      >
        S
      </text>
    </svg>
  )
}
