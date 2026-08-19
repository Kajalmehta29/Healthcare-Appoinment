/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#2563eb', // Primary brand blue
          600: '#1d4ed8',
          700: '#1e40af',
        },
        accent: {
          teal: '#14b8a6', // Teal accents
          rose: '#e11d48', // Urgent / danger states
          amber: '#f59e0b', // Warnings / pending states
        },
        charcoal: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

