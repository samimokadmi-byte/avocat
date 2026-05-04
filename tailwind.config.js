/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: '#FDFCFB',
        navy: '#0A192F',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 5vw, 4.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        heading: ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        subhead: ['clamp(1.125rem, 1.5vw, 1.25rem)', { lineHeight: '1.5' }],
        stat: ['clamp(2.5rem, 4vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      spacing: {
        section: '6rem',
        'section-sm': '3rem',
      },
      maxWidth: {
        'prose-luxury': '65ch',
        content: '1100px',
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
