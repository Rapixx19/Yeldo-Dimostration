import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F8F5EE',
        card: '#FFFFFF',
        soft: '#F0EBE0',
        brand: {
          dark: '#1C2820',
          accent: '#A87432',
        },
        text: {
          primary: '#1C2820',
          secondary: '#5A6B5F',
          tertiary: '#8B9285',
          success: '#4A7C3A',
          warning: '#B45309',
          danger: '#991B1B',
        },
        'border-light': 'rgba(28, 40, 32, 0.08)',
        'border-mid': 'rgba(28, 40, 32, 0.15)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
