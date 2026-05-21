import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dc-bg': '#313338',
        'dc-sidebar': '#2b2d31',
        'dc-header': '#313338',
        'dc-input': '#383a40',
        'dc-hover': '#35373c',
        'dc-active': '#404249',
        'dc-text': '#dcddde',
        'dc-muted': '#96989d',
        'dc-accent': '#5865f2',
        'dc-green': '#23a55a',
        'dc-red': '#f23f42',
        'dc-border': '#1e1f22',
      },
    },
  },
  plugins: [],
} satisfies Config
