/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "rabbit-red": "#ea2e0e",
        navratri: {
          burgundy: "#4A0712",
          darkBurgundy: "#650B18",
          wine: "#3A0610",
          maroon: "#7A1522",
          gold: "#D4A017",
          brightGold: "#F2C94C",
          orange: "#F59E0B",
          cream: "#FFF8E7",
          ivory: "#FFFDF5",
          mutedGold: "#B88916",
        },
      },
    },
  },
  plugins: [],
}