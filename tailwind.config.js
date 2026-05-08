/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Design system "Éditorial × OS" ──────────────────────────
        ink: {
          DEFAULT: '#1C3528',   // vert forêt profond (Equitas)
          soft:    '#264637',   // vert forêt moyen pour les cartes/sections alternées
        },
        text2:   '#4A6355',
        paper: {
          DEFAULT: '#F4F3EE',
          2:       '#E8E4DB',
        },
        hairline: {
          DEFAULT: '#D8D4C8',
          strong:  '#C8C2B4',
        },
        accent:  '#C49A58',     // doré ambré (Equitas CTA)
        wine: {
          DEFAULT: '#1E0603',   // bordeaux profond (accent chaleur)
          soft:    '#4A0C08',   // bordeaux moyen (visible sur fond sombre)
        },
        status: {
          green: '#15803D',
          amber: '#A16207',
          red:   '#B91C1C',
        },
        // ── Legacy tokens (dashboard / auth — inchangés) ─────────────
        offwhite: '#F4F3EE',
        navy:     '#1C3528',
        gold:     '#C49A58',
        dark: {
          bg:      '#0F1E16',
          surface: '#172A1F',
          card:    '#1C3528',
        },
        light: '#D8E4DC',
      },
      fontFamily: {
        display: ['"Fraunces"', '"EB Garamond"', 'Georgia', 'serif'],
        serif:   ['"Fraunces"', '"EB Garamond"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['clamp(3.5rem, 6vw, 4.875rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        heading: ['clamp(2.75rem, 5vw, 4rem)',     { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        subhead: ['clamp(1.5rem, 2vw, 2rem)',       { lineHeight: '1.35' }],
        body:    ['17px',                           { lineHeight: '1.75' }],
        small:   ['14px',                           { lineHeight: '1.65' }],
        stat:    ['clamp(2.5rem, 4vw, 4rem)',       { lineHeight: '1',    letterSpacing: '-0.03em' }],
      },
      spacing: {
        section:        '9rem',
        'section-dense':'6rem',
        'section-sm':   '3rem',
      },
      maxWidth: {
        'prose-luxury': '65ch',
        content:        '1280px',
      },
      boxShadow: {
        card:        '0 2px 8px 0 rgba(15,23,42,0.06)',
        'card-hover':'0 8px 24px 0 rgba(15,23,42,0.10)',
      },
    },
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  plugins: [],
}
