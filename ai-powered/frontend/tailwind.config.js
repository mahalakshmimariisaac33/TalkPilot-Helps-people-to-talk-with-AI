export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          100: '#c8f0cd',
          400: '#4a8f54',
          700: '#1a3a20',
          800: '#0c1a0e',
        },
        accent: '#22c55e',
        'accent-dark': '#16a34a',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}