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
          DEFAULT: '#0A0A0F',
          secondary: '#111118',
          elevated: '#1A1A24',
          card: '#16161F',
        },
        surface: {
          DEFAULT: '#1E1E2E',
          hover: '#252535',
        },
        border: {
          DEFAULT: '#2A2A3D',
          subtle: '#1E1E2E',
        },
        accent: {
          DEFAULT: '#7C6EF8',
          hover: '#6B5DE8',
          muted: '#7C6EF820',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0B8',
          muted: '#606078',
          inverse: '#0A0A0F',
        },
        status: {
          success: '#4CAF7D',
          warning: '#F5A623',
          error: '#E85D5D',
          info: '#5B9CF6',
        },
      },
      fontFamily: {
        sans: ['Geist-Regular'],
        display: ['Geist-Bold'],
        mono: ['Geist-Mono'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
