/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#080808',
          secondary: '#080808',
          elevated: '#161616',
          card: '#0E0E0E',
        },
        surface: {
          DEFAULT: '#0E0E0E',
          hover: '#161616',
          elevated: '#161616',
        },
        border: {
          DEFAULT: '#333333',
          subtle: '#1E1E1E',
          strong: '#444444',
        },
        accent: {
          DEFAULT: '#7C6EF8',
          hover: '#6B5FE0',
          muted: '#7C6EF814',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#BBBBBB',
          muted: '#666666',
          inverse: '#080808',
        },
        status: {
          success: '#44CC88',
          warning: '#FFAA33',
          error: '#FF4444',
          info: '#4488FF',
        },
      },
      fontFamily: {
        sans: ['Geist-Regular'],
        display: ['Newsreader-SemiBold'],
        serif: ['Newsreader-Medium'],
        mono: ['Geist-Mono'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
