/**
 * Tailwind configuration to enable JIT mode and scan the app
 * directory for class names. You can extend the theme as needed
 * to match the desired colour palette. Here we define a
 * brand-blue colour for buttons and accents.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/**/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2154F3'
        }
      }
    }
  },
  plugins: []
};
