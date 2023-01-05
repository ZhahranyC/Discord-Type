/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        "main-purple": "#6E82FE",
        "sub-purple-2": "#4353A9",
        "sub-purple-1": "#606CF1",
        "main-black": "#242424",
        "sub-black-dark": "#1B1B1B",
        "sub-black-light": "#282828",
        "main-gray": "#656565",
        "sub-gray-dark": "#373737",
      },
      fontFamily: {
        "lexend-deca": ["Lexend Deca", "sans-serif"],
      },
      gridTemplateRows: {
        "dis-monkey": "47px 1fr",
      },
      keyframes: {
        caret: {
          "0%, to": {
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
        },
      },
      animation: {
        caret: "caret 0.85s infinite",
      },
    },
  },
  plugins: [],
};
