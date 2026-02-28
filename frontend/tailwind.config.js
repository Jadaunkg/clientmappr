/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#082f49',
        },
        secondary: {
          50: '#f5f3ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
      },
      fontFamily: {
        sans: ['InterVar', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
