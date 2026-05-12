interface LogoProps {
  size?: number
  className?: string
}

/**
 * Logo SVG Cabinet Mokadmi — "Legal & Advisory"
 * Remplace le logo_processed.png pour permettre la modification du sous-titre.
 * Conserve la charte : fond dark-bg (#070C18), dorure (#C9A96E), off-white (#E8EDF5)
 */
export default function Logo({ size = 160, className = '' }: LogoProps) {
  // Le logo est en ratio 8:5 (paysage) : cercle à gauche + texte à droite
  const h = size
  const w = Math.round(size * 1.6)
  const cx = Math.round(h / 2)
  const r  = Math.round(h / 2 - 2)

  const fontSize = {
    initiales:  Math.round(h * 0.38),
    nom:        Math.round(h * 0.115),
    titre:      Math.round(h * 0.078),
    separateur: Math.round(h * 0.055),
  }

  const textX = cx + r + Math.round(h * 0.12)
  const textCenterX = textX + Math.round((w - textX - 4) / 2)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label="Maître Mokadmi Sami — Legal & Advisory"
      className={className}
    >
      {/* Fond transparent */}
      <rect width={w} height={h} fill="transparent" />

      {/* ── Cercle emblème ── */}
      {/* Halo externe */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#C9A96E" strokeWidth="0.6" opacity="0.25" />
      {/* Cercle principal */}
      <circle cx={cx} cy={cx} r={r - 3} fill="#070C18" stroke="#C9A96E" strokeWidth="0.8" opacity="0.75" />
      {/* Cercle intérieur décoratif */}
      <circle cx={cx} cy={cx} r={r - 8} fill="none" stroke="#C9A96E" strokeWidth="0.3" opacity="0.3" />

      {/* Initiales MS */}
      <text
        x={cx - Math.round(fontSize.initiales * 0.26)}
        y={cx + Math.round(fontSize.initiales * 0.36)}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={fontSize.initiales}
        fill="#C9A96E"
        opacity="0.92"
      >M</text>
      <text
        x={cx + Math.round(fontSize.initiales * 0.26)}
        y={cx + Math.round(fontSize.initiales * 0.36)}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={fontSize.initiales}
        fill="#E8EDF5"
        opacity="0.82"
      >S</text>

      {/* ── Bloc texte à droite ── */}
      {/* Ligne décorative verticale */}
      <line
        x1={textX - Math.round(h * 0.07)}
        y1={Math.round(h * 0.18)}
        x2={textX - Math.round(h * 0.07)}
        y2={Math.round(h * 0.82)}
        stroke="#C9A96E"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* Nom complet */}
      <text
        x={textCenterX}
        y={Math.round(h * 0.38)}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={fontSize.nom}
        fontWeight="bold"
        fill="#E8EDF5"
        letterSpacing="0.08em"
        opacity="0.95"
      >MAÎTRE MOKADMI SAMI</text>

      {/* Séparateur doré */}
      <line
        x1={textCenterX - Math.round(w * 0.12)}
        y1={Math.round(h * 0.5)}
        x2={textCenterX + Math.round(w * 0.12)}
        y2={Math.round(h * 0.5)}
        stroke="#C9A96E"
        strokeWidth="0.5"
        opacity="0.5"
      />

      {/* Sous-titre : Legal & Advisory */}
      <text
        x={textCenterX}
        y={Math.round(h * 0.65)}
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontSize={fontSize.titre}
        fill="#C9A96E"
        letterSpacing="0.2em"
        opacity="0.85"
      >LEGAL &amp; ADVISORY</text>

      {/* Barreau de Tunis */}
      <text
        x={textCenterX}
        y={Math.round(h * 0.82)}
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontSize={fontSize.separateur}
        fill="#E8EDF5"
        letterSpacing="0.12em"
        opacity="0.3"
      >BARREAU DE TUNIS</text>
    </svg>
  )
}

