/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./resources/js/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
