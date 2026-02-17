import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // World-inspired color palette
        world: {
          blue: '#4940E0',
          'blue-light': '#6B63FF',
          'blue-dark': '#3730A3',
        },
        // Dark theme colors
        dark: {
          bg: '#0a0a0a',
          'bg-secondary': '#141414',
          'bg-tertiary': '#1a1a1a',
          border: '#262626',
          'border-light': '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
