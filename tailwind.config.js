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
          DEFAULT: '#0F172A',
          soft:    '#1F2937',
        },
        text2:   '#475569',
        paper: {
          DEFAULT: '#FAF8F2',
          2:       '#F0EBDB',
        },
        hairline: {
          DEFAULT: '#E5DFD0',
          strong:  '#D7CFB7',
        },
        accent:  '#A47A2C',
        status: {
          green: '#15803D',
          amber: '#A16207',
          red:   '#B91C1C',
        },
        // ── Legacy tokens (dashboard / auth — inchangés) ─────────────
        offwhite: '#FDFCFB',
        navy:     '#0A192F',
        gold:     '#C9A96E',
        dark: {
          bg:      '#070C18',
          surface: '#0C1220',
          card:    '#111B2E',
        },
        light: '#E8EDF5',
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
        subhead: ['clamp(1.5rem, 2vw, 2rem)',       { lineHeight: '1.3'  }],
        body:    ['17px',                           { lineHeight: '1.55' }],
        small:   ['13px',                           { lineHeight: '1.5'  }],
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
