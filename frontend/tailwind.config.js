/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        accent: {
          indigo: '#4F46E5',
          green: '#22C55E',
          orange: '#F59E0B',
          red: '#EF4444',
        },
        bg: {
          page: '#F8FAFC',
          card: '#FFFFFF',
          surface: '#F1F5F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        light: {
          blue: '#DBEAFE',
          green: '#DCFCE7',
          orange: '#FEF3C7',
          purple: '#EDE9FE',
        },
        // Extended slate shades used across the codebase
        slate: {
          55: '#F8FAFC',
          105: '#E8ECF1',
          150: '#CBD5E1',
          405: '#94A3B8',
          450: '#9CA3AF',
          455: '#9CA3AF',
          650: '#4B5563',
          655: '#4B5563',
          850: '#1E293B',
        },
        // Extended blue shades
        blue: {
          650: '#2563EB',
        },
        // Extended red shades
        red: {
          650: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Outfit', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      width: {
        4.5: '1.125rem',
      },
      height: {
        4.5: '1.125rem',
      },
    },
  },
  plugins: [],
}
