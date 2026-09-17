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
        // Storefront palette, modelled on ronin.pk.
        mist: "#F0F0F0",
        charcoal: "#464646",
        steel: "#8896AB",
        onyx: "#111111",
        gold: "#C9A25B",
        royal: "#1E51EE",
        page: "#F0F0F0",
        card: "#FFFFFF",
        night: "#111111",
        graphite: "#3D3D3D",
        slate: "#6B6B6B",
        hair: "#E3E3E3",
        sale: "#E11D2E",
        leaf: "#16A34A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
