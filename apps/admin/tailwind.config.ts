import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1B4D7A',
          secondary: '#2C8C9E',
        },
        surface: {
          warm: '#F8F4EE',
          white: '#FFFFFF',
        },
        ink: {
          strong: '#0F1B2D',
          soft: '#4A5568',
        },
        accent: {
          olive: '#6B7F4E',
          copper: '#B8654A',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'IBM Plex Sans Arabic',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        arabic: ['IBM Plex Sans Arabic', 'Noto Naskh Arabic', 'system-ui', 'sans-serif'],
      },
      maxWidth: { reading: '72ch' },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
} satisfies Config;
