/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blu: "#359DD5",
        bianco: "#F3F9FD",
        giallo: "#FFCC07",
        nero: "#142739",
        grigio: "#E9E9E9",
        lower: "#2E9BD5",
        middle: "#256CAE",
        upper: "#0E1928",
        grigioQualifica: "#444443",
        gialloQualifica: "#FFC505",
        rossoTag: "#CE2B37",
        rossoTesto: "#f15467",
        sfondoPagina: "#280202",
      },
    },
  },
  plugins: [],
};
