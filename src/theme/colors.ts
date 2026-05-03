export const colors = {
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
    canonical: '#7C6EF8',
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
  reader: {
    background: '#000000',
    overlay: 'rgba(0,0,0,0.85)',
    scrubber: '#7C6EF8',
  },
} as const;

export type ColorKey = keyof typeof colors;
