/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A1A',
        accent: '#C9A96E',
        'text-primary': '#E8E8E8',
        'text-secondary': '#888888',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        '65ch': '65ch',
      },
      lineHeight: {
        reading: '1.9',
      },
    },
  },
  plugins: [],
}
