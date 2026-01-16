/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '@media (forced-colors: active)': {
          '.input-forced-colors': {
            'background-color': 'canvas !important',
            'color': 'canvasText !important',
            'border': '2px solid canvasText !important',
          },
          '.placeholder-forced-colors::placeholder': {
            'color': 'GrayText !important',
          },
        },
      });
    },
  ],
};