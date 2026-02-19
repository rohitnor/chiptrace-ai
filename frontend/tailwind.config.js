/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        /* Cinematic surface palette */
        surface: {
          0: '#000000',
          1: 'rgba(255,255,255,0.035)',
          2: 'rgba(255,255,255,0.06)',
        },
        /* Muted, dark accent colors — no bright neons */
        critical: {
          DEFAULT: '#8B2020',
          text: '#D97070',
        },
        warn: {
          DEFAULT: '#7A5C1E',
          text: '#C9A84C',
        },
        ok: {
          DEFAULT: '#1E5C3A',
          text: '#5BAD82',
        },
        info: {
          DEFAULT: '#1E3A5C',
          text: '#6AABCF',
        },
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      maxWidth: {
        '8xl': '90rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.06) inset',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.34,1.20,0.64,1) both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
