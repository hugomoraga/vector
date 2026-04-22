import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F6F8FA',
          100: '#E5E5E5',
          200: '#D1D1D1',
          300: '#BDBDBD',
          400: '#999999',
          500: '#666666',
          600: '#333333',
          700: '#222222',
          800: '#191919',
          900: '#111111',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F6F8FA',
        },
        accent: {
          DEFAULT: '#111111',
          muted: '#666666',
        },
        status: {
          success: '#2DA44E',
          warning: '#BF8700',
          error: '#D1242F',
          info: '#666666',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.025em' }],
        'heading': ['1.5rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.015em' }],
        'subheading': ['1.125rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '-0.01em' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'overline': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};

export default config;