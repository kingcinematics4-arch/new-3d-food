/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dine3D Design System
        // Backgrounds
        'dine-black':   '#0B0A08',
        'dine-black-2': '#11100D',
        'dine-black-3': '#15130F',
        'dine-surface': '#171511',
        'dine-surface-2': '#1C1914',
        'dine-surface-3': '#211E19',
        // Gold accent palette
        'dine-gold':    '#C9A96E',
        'dine-gold-2':  '#B8935A',
        'dine-gold-3':  '#D4B483',
        'dine-gold-dim': '#7A6340',
        'dine-gold-pale': '#E8D5B0',
        // Text
        'dine-ivory':   '#F5F0E8',
        'dine-cream':   '#E8DFD0',
        'dine-warm-gray': '#9A9080',
        'dine-muted':   '#6B6258',
        // Borders
        'dine-border':  '#2A2520',
        'dine-border-2': '#352F28',
        'dine-border-gold': '#3A3020',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['6rem', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'heading-xl': ['2rem', { lineHeight: '1.2' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.3' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.15em' }],
        'label-xs': ['0.5625rem', { lineHeight: '1.4', letterSpacing: '0.2em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgba(201,169,110,0.04)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
        'dot-pattern': "radial-gradient(circle, rgba(201,169,110,0.06) 1px, transparent 1px)",
        'radial-gold': "radial-gradient(ellipse at center, rgba(201,169,110,0.08) 0%, transparent 70%)",
        'radial-warm': "radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.05) 0%, transparent 60%)",
      },
      boxShadow: {
        'gold-sm': '0 0 0 1px rgba(201,169,110,0.15)',
        'gold-md': '0 4px 24px rgba(201,169,110,0.08)',
        'gold-lg': '0 8px 48px rgba(201,169,110,0.12)',
        'gold-glow': '0 0 32px rgba(201,169,110,0.15)',
        'surface-sm': '0 1px 4px rgba(0,0,0,0.6)',
        'surface-lg': '0 16px 64px rgba(0,0,0,0.8)',
        'inset-gold': 'inset 0 1px 0 rgba(201,169,110,0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
