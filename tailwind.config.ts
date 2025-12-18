import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base colors - Using CSS variables for theme support
        ink: {
          950: 'var(--bg-primary)',
          900: 'var(--bg-primary)',
          850: 'var(--bg-secondary)',
          800: 'var(--bg-tertiary)',
          700: 'var(--bg-elevated)',
          600: 'var(--bg-hover)',
          500: 'var(--border-default)',
          400: 'var(--border-default)',
          300: 'var(--text-muted)',
        },
        // Accent colors - Using CSS variables
        amber: {
          DEFAULT: 'var(--accent-primary)',
          light: 'var(--accent-secondary)',
          dark: 'var(--accent-muted)',
          muted: 'var(--accent-glow)',
        },
        // Text colors - Using CSS variables
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        // Status colors - These can stay static as they're semantic
        status: {
          active: '#22c55e',
          'on-hold': '#f59e0b',
          completed: '#3b82f6',
          dropped: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace'
        ]
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-lg': '0 0 30px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.15)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(245, 158, 11, 0.15)' },
        },
      },
    }
  },
  plugins: []
} satisfies Config
