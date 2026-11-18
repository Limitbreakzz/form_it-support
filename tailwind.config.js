/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: [
        '"IBM Plex Sans Thai"',
        '"Noto Sans Thai"',
        '"Anuphan"',
        'Tahoma',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif',
      ],
      serif: [
        '"IBM Plex Sans Thai"',
        '"Noto Sans Thai"',
        'sans-serif',
      ],
      mono: [
        '"IBM Plex Sans Thai"',
        '"IBM Plex Mono"',
        'ui-monospace',
        'SFMono-Regular',
        'monospace',
      ],
    },
    extend: {
      colors: {
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          mutedLight: '#f8fafc',
          mutedDark: '#1e293b',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite linear',
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        scaleIn: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
