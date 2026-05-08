interface LogoProps {
  size?: number
  className?: string
  /** 'light' = paper (sur fond sombre) · 'brand' = vert forêt (sur fond clair) */
  variant?: 'light' | 'brand'
}

export default function Logo({ size = 160, className = '', variant = 'light' }: LogoProps) {
  const c = variant === 'brand' ? '#1C3528' : '#F4F3EE'

  // Proportions : 200 × 275 (portrait)
  const W = 200, H = 275

  return (
    <svg
      width={size}
      height={Math.round(size * (H / W))}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mokadmi.lawyer — Ingénieurie Juridique"
      className={className}
    >
      {/* ── Oval border ───────────────────────────────────────── */}
      <ellipse
        cx="100" cy="108"
        rx="63" ry="92"
        fill="none"
        stroke={c}
        strokeWidth="1.4"
      />

      {/* ── S — haut, calligraphique ──────────────────────────── */}
      <text
        x="120" y="84"
        textAnchor="middle"
        fontFamily='"Great Vibes", cursive'
        fontSize="62"
        fill={c}
      >
        S
      </text>

      {/* ── M — grand, calligraphique, bas-gauche ─────────────── */}
      <text
        x="93" y="162"
        textAnchor="middle"
        fontFamily='"Great Vibes", cursive'
        fontSize="100"
        fill={c}
      >
        M
      </text>

      {/* ── Mokadmi.lawyer — script ───────────────────────────── */}
      <text
        x="100" y="220"
        textAnchor="middle"
        fontFamily='"Great Vibes", cursive'
        fontSize="21"
        fill={c}
      >
        Mokadmi.lawyer
      </text>

      {/* ── INGENIEURIE JURIDIQUE — uppercase espacé ─────────── */}
      <text
        x="100" y="250"
        textAnchor="middle"
        fontFamily='"Inter", system-ui, sans-serif'
        fontSize="8"
        fontWeight="400"
        letterSpacing="3"
        fill={c}
      >
        INGENIEURIE JURIDIQUE
      </text>
    </svg>
  )
}
