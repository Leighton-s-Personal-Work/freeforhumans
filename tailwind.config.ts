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
        world: {
          blue: '#4940E0',
          'blue-light': '#6B63FF',
          'blue-dark': '#3730A3',
        },
        gold: {
          DEFAULT: '#b8860b',
          light: '#d4a843',
          lighter: '#f0e1b9',
          bg: '#fdf8ef',
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
        'coin-drop': 'coinDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'coin-glow': 'coinGlow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        coinDrop: {
          '0%': { transform: 'translateY(-80px) rotate(0deg)', opacity: '0' },
          '30%': { opacity: '1' },
          '60%': { transform: 'translateY(10px) rotate(360deg)' },
          '80%': { transform: 'translateY(-4px) rotate(380deg)' },
          '100%': { transform: 'translateY(0px) rotate(360deg)', opacity: '1' },
        },
        coinGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(184, 134, 11, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(184, 134, 11, 0.4)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
