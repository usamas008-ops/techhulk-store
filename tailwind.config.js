/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E170F",
        panel: "#152018",
        line: "#26362A",
        signal: "#C7FF4D",
        signalDim: "#8FCC2E",
        paper: "#F3F3EE",
        muted: "#9BAA9C",
        danger: "#FF6B57",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
