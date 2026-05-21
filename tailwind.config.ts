import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        econ: {
          // Class tiers — deep 700-level. Indigo/teal/amber/red.
          upper: '#4338CA',
          middle: '#0F766E',
          lower: '#B45309',
          exclusion: '#B91C1C',
          // Roles — Sankey agent nodes, histogram bars
          worker: '#16A34A',
          capitalist: '#D97706',
          // Institutions — Sankey institution nodes
          state: '#2563EB',
          firm: '#9333EA',
          // Metric sparklines
          toxic: '#F472B6',
          circulation: '#22D3EE',
          // Accent — sky blue from design reference
          accent: '#7AB3CF',
          // Chrome — white / black / sky-blue scheme
          bg: '#F5F8FA',
          card: '#FFFFFF',
          border: '#D2E4EF',
          ink: '#0A0E14',
          muted: '#5C7585',
          softbg: '#EDF4F9',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(10, 30, 50, 0.06), 0 2px 8px rgba(10, 30, 50, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
