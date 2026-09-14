/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Admin dashboard keeps the original dark palette.
        ink: "#0E170F",
        panel: "#152018",
        line: "#26362A",
        signal: "#C7FF4D",
        signalDim: "#8FCC2E",
        paper: "#F3F3EE",
        muted: "#9BAA9C",
        danger: "#FF6B57",
        // Storefront palette: light page, white cards, near-black type.
        page: "#F0F0F0",
        card: "#FFFFFF",
        night: "#141414",
        graphite: "#3D3D3D",
        slate: "#6B6B6B",
        hair: "#E3E3E3",
        sale: "#D42A2A",
        leaf: "#16A34A",
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
