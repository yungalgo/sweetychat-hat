// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          'neue-haas': ['Neue Haas Grotesk Display', 'sans-serif'],
        },
        animation: {
          'fadeIn': 'fadeIn 0.3s ease',
        },
        keyframes: {
          fadeIn: {
            'from': { opacity: '0', transform: 'translateY(-10px)' },
            'to': { opacity: '1', transform: 'translateY(0)' },
          },
        },
        borderWidth: {
          '3': '3px',
        },
      },
    },
    plugins: [],
  }