import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1B4D7A',
        'brand-secondary': '#2C8C9E',
        'surface-warm': '#F8F4EE',
        'surface-white': '#FFFFFF',
        'ink-strong': '#0F1B2D',
        'ink-soft': '#4A5568',
        'accent-olive': '#6B7F4E',
        'accent-copper': '#B8654A',
      },
      maxWidth: { reading: '72ch' },
    },
  },
  plugins: [],
} satisfies Config;
